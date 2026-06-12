from celery import Celery
from core.config import settings

celery_app = Celery(
    "visionforge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["tasks.video"],
)

celery_app.conf.update(
    task_routes={"tasks.video.*": {"queue": "video_gen"}},
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,           # task acked only after completion
    worker_prefetch_multiplier=1,  # one task per worker slot (important for GPU)
    task_track_started=True,
    result_expires=3600,
)
