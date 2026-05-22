from __future__ import annotations

from datetime import datetime, timezone

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import select

from app.core.settings import settings
from app.db.models import Job
from app.db.session import get_db_session
from app.services.video_generation import generate_video_bytes
from app.storage.factory import get_storage


@shared_task(name="app.tasks.video.process_job", bind=True, max_retries=3, default_retry_delay=10)
def process_job(self, job_id: str) -> None:
    storage = get_storage()

    with get_db_session() as session:
        job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
        if not job:
            return

        if job.status == "COMPLETED":
            return

        job.attempts = (job.attempts or 0) + 1
        job.started_at = job.started_at or datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)

    try:
        video_bytes = generate_video_bytes(prompt=job.prompt, params=job.request_params or {})
        object_key = (
            f"{settings.normalized_s3_prefix()}{job_id}.mp4" if settings.video_storage.lower() == "s3" else f"{job_id}.mp4"
        )
        put_result = storage.put_bytes(object_key=object_key, content=video_bytes, content_type="video/mp4")

        with get_db_session() as session:
            job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
            if not job or job.status == "COMPLETED":
                return
            job.status = "COMPLETED"
            job.video_object_key = put_result.object_key
            job.video_path = storage.local_path_for(put_result.object_key)
            job.error_code = None
            job.error_message = None
            job.completed_at = datetime.now(timezone.utc)
            job.updated_at = datetime.now(timezone.utc)
            job.output_meta = {**(job.output_meta or {}), "content_type": "video/mp4"}
            session.add(job)

    except Exception as e:
        # Only mark ERROR when retries are exhausted; otherwise keep IN_PROGRESS.
        msg = str(e)
        try:
            with get_db_session() as session:
                job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
                if job and job.status != "COMPLETED":
                    job.status = "IN_PROGRESS"
                    job.error_code = "UPSTREAM_RETRYING"
                    job.error_message = msg
                    job.updated_at = datetime.now(timezone.utc)
                    session.add(job)
            raise self.retry(exc=e)
        except MaxRetriesExceededError:
            with get_db_session() as session:
                job = session.execute(select(Job).where(Job.job_id == job_id)).scalar_one_or_none()
                if job and job.status != "COMPLETED":
                    job.status = "ERROR"
                    job.error_code = "GENERATION_FAILED"
                    job.error_message = msg
                    job.updated_at = datetime.now(timezone.utc)
                    session.add(job)
            return
