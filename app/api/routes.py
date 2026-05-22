from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import redis
from sqlalchemy import select, text

from app.core.settings import settings
from app.db.models import Job
from app.db.session import get_db_session
from app.schemas import (
    GenerateRequest,
    GenerateResponse,
    JobResponse,
    VideoErrorResponse,
    VideoNotReadyResponse,
    VideoSignedUrlResponse,
)
from app.storage.factory import get_storage
from app.tasks.celery_app import celery_app as _celery_app  # noqa: F401
from app.tasks.video import process_job


router = APIRouter()


@router.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@router.get("/readyz")
def readyz() -> dict:
    try:
        # DB check
        with get_db_session() as session:
            session.execute(text("SELECT 1"))

        # Redis check
        r = redis.Redis.from_url(settings.redis_url)
        r.ping()

        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Not ready: {e}")


@router.post("/generate", response_model=GenerateResponse, status_code=202)
def generate(req: GenerateRequest) -> GenerateResponse:
    job_id = str(uuid.uuid4())

    with get_db_session() as session:
        job = Job(
            job_id=job_id,
            prompt=req.prompt,
            status="IN_PROGRESS",
            model=settings.hf_model,
            provider=settings.hf_provider,
            request_params=req.params or {},
            output_meta={},
            attempts=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(job)

    process_job.delay(job_id)
    return GenerateResponse(job_id=job_id, status="IN_PROGRESS")


@router.get("/status/{job_id}", response_model=JobResponse)
def status(job_id: str) -> JobResponse:
    with get_db_session() as session:
        job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        error = None
        if job.status == "ERROR" and job.error_code and job.error_message:
            error = {"code": job.error_code, "message": job.error_message}

        return JobResponse(
            job_id=job.job_id,
            status=job.status,
            created_at=job.created_at,
            updated_at=job.updated_at,
            error=error,
        )


@router.get("/video/{job_id}")
def video(job_id: str):
    storage = get_storage()

    with get_db_session() as session:
        job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status == "IN_PROGRESS":
            return JSONResponse(status_code=409, content=VideoNotReadyResponse().model_dump())

        if job.status == "ERROR":
            msg = job.error_message or "Generation failed"
            return JSONResponse(status_code=422, content=VideoErrorResponse(message=msg).model_dump())

        if not job.video_object_key:
            raise HTTPException(status_code=500, detail="Job completed but video is missing")

        if settings.video_storage.lower() == "s3":
            url = storage.presigned_get_url(job.video_object_key, settings.signed_url_ttl_seconds)
            if not url:
                raise HTTPException(status_code=500, detail="Failed to create signed URL")
            return VideoSignedUrlResponse(
                job_id=job.job_id,
                download_url=url,
                expires_in_seconds=settings.signed_url_ttl_seconds,
            )

        # local mode
        if not job.video_path:
            path = storage.local_path_for(job.video_object_key)
        else:
            path = job.video_path
        if not path:
            raise HTTPException(status_code=500, detail="Local video path unavailable")
        return FileResponse(path=path, media_type="video/mp4", filename=f"{job_id}.mp4")
