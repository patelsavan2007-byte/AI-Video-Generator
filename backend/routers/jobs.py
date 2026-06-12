import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import redis as sync_redis

from db.session import get_db
from db.models import User, Video, GenJob, JobStatus
from core.security import get_current_user
from core.config import settings
from schemas.jobs import JobStatusResponse, VideoListItem
from worker_app import celery_app

router = APIRouter(prefix="/v1", tags=["jobs"])

# Sync redis client for simple GET operations (fast path)
_redis = sync_redis.from_url(settings.REDIS_URL, decode_responses=True)


def _build_job_response(job: GenJob, video: Video, progress_override: int | None = None) -> JobStatusResponse:
    return JobStatusResponse(
        job_id=str(job.job_id),
        status=video.status.value,
        progress=progress_override if progress_override is not None else job.progress,
        prompt=video.prompt,
        video_url=video.video_url,
        thumbnail_url=video.thumbnail_url,
        error_msg=job.error_msg,
        duration=job.duration,
        fps=job.fps,
        resolution=job.resolution,
        seed=job.seed,
        aspect_ratio=job.aspect_ratio,
        init_image_url=job.init_image_url,
        created_at=job.created_at,
        completed_at=job.completed_at,
        gpu_sec=job.gpu_sec,
        cost_usd=job.cost_usd,
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fast path: check Redis for live progress
    cached_progress = _redis.get(f"job:{job_id}:progress")

    result = await db.execute(
        select(GenJob)
        .where(GenJob.job_id == uuid.UUID(job_id))
        .options(selectinload(GenJob.video))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Authorization check
    if str(job.video.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not your job")

    progress = int(cached_progress) if cached_progress else job.progress
    return _build_job_response(job, job.video, progress)


@router.delete("/jobs/{job_id}", status_code=204)
async def cancel_job(
    job_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GenJob)
        .where(GenJob.job_id == uuid.UUID(job_id))
        .options(selectinload(GenJob.video))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.video.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.video.status not in (JobStatus.queued, JobStatus.processing):
        raise HTTPException(status_code=400, detail="Job already finished")

    # Revoke Celery task
    celery_app.control.revoke(job_id, terminate=True)

    job.video.status = JobStatus.cancelled
    await db.commit()


@router.post("/jobs/{job_id}/rerun", response_model=JobStatusResponse, status_code=202)
async def rerun_job(
    job_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GenJob)
        .where(GenJob.job_id == uuid.UUID(job_id))
        .options(selectinload(GenJob.video))
    )
    original_job = result.scalar_one_or_none()
    if not original_job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(original_job.video.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not your job")

    # Clone the video record
    new_video = Video(
        user_id=uuid.UUID(user_id),
        prompt=original_job.video.prompt,
        negative_prompt=original_job.video.negative_prompt,
        status=JobStatus.queued,
    )
    db.add(new_video)
    await db.flush()

    import random
    new_job = GenJob(
        video_id=new_video.id,
        duration=original_job.duration,
        fps=original_job.fps,
        resolution=original_job.resolution,
        seed=random.randint(0, 2**32 - 1),  # new seed for different output
        aspect_ratio=original_job.aspect_ratio,
        init_image_url=original_job.init_image_url,
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    await db.refresh(new_video)

    celery_app.send_task(
        "tasks.video.generate_video",
        kwargs={
            "job_id": str(new_job.job_id),
            "video_id": str(new_video.id),
            "prompt": new_video.prompt,
            "negative_prompt": new_video.negative_prompt,
            "duration": new_job.duration,
            "fps": new_job.fps,
            "resolution": new_job.resolution,
            "seed": new_job.seed,
            "aspect_ratio": new_job.aspect_ratio,
            "init_image_url": new_job.init_image_url,
        },
        queue="video_gen",
    )

    return _build_job_response(new_job, new_video)


@router.get("/videos", response_model=List[VideoListItem])
async def list_videos(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    result = await db.execute(
        select(Video, GenJob)
        .join(GenJob, GenJob.video_id == Video.id)
        .where(Video.user_id == uuid.UUID(user_id))
        .order_by(Video.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    return [
        VideoListItem(
            id=str(video.id),
            job_id=str(job.job_id),
            prompt=video.prompt,
            video_url=video.video_url,
            thumbnail_url=video.thumbnail_url,
            status=video.status.value,
            created_at=video.created_at,
            duration=job.duration,
            resolution=job.resolution,
        )
        for video, job in rows
    ]
