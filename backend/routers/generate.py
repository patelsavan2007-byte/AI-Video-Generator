import uuid
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import aiofiles

from db.session import get_db
from db.models import User, Video, GenJob, JobStatus
from core.security import get_current_user
from core.config import settings
from schemas.generate import GenerateRequest, GenerateResponse, UploadImageResponse
from worker_app import celery_app

router = APIRouter(prefix="/v1", tags=["generate"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate_video(
    body: GenerateRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Create Video record
    video = Video(
        user_id=uuid.UUID(user_id),
        prompt=body.prompt,
        negative_prompt=body.negative_prompt,
        status=JobStatus.queued,
    )
    db.add(video)
    await db.flush()  # get video.id without committing

    # Create GenJob record
    job = GenJob(
        video_id=video.id,
        duration=body.duration,
        fps=body.fps,
        resolution=body.resolution,
        seed=body.seed,
        aspect_ratio=body.aspect_ratio,
        init_image_url=body.init_image_url,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Dispatch Celery task (non-blocking)
    celery_app.send_task(
        "tasks.video.generate_video",
        kwargs={
            "job_id": str(job.job_id),
            "video_id": str(video.id),
            "prompt": body.prompt,
            "negative_prompt": body.negative_prompt,
            "duration": body.duration,
            "fps": body.fps,
            "resolution": body.resolution,
            "seed": body.seed,
            "aspect_ratio": body.aspect_ratio,
            "init_image_url": body.init_image_url,
        },
        queue="video_gen",
    )

    return GenerateResponse(job_id=str(job.job_id), status="queued")


@router.post("/upload-image", response_model=UploadImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {ALLOWED_IMAGE_TYPES}"
        )

    upload_id = str(uuid.uuid4())
    upload_dir = Path(settings.MEDIA_ROOT) / "uploads" / user_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    file_path = upload_dir / f"{upload_id}{ext}"

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    url = f"/media/uploads/{user_id}/{upload_id}{ext}"
    return UploadImageResponse(upload_id=upload_id, url=url)
