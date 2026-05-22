from __future__ import annotations

from celery import Celery

from app.core.settings import settings


celery_app = Celery(
    "hf_ttv_provider",
    broker=settings.resolved_celery_broker_url(),
    backend=settings.resolved_celery_result_backend(),
    include=["app.tasks.video"],
)

celery_app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="video_generation",
    task_routes={"app.tasks.video.process_job": {"queue": "video_generation"}},
)

# Ensure this app becomes the default/current app so .delay() uses the right broker/backend.
celery_app.set_default()
celery_app.set_current()
