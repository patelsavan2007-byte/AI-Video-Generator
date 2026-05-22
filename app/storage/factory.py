from __future__ import annotations

from app.core.settings import settings
from app.storage.base import Storage
from app.storage.local import LocalStorage
from app.storage.s3 import S3Storage


def get_storage() -> Storage:
    mode = (settings.video_storage or "local").lower()
    if mode == "local":
        return LocalStorage(settings.local_video_dir)
    if mode == "s3":
        if not settings.s3_bucket:
            raise RuntimeError("S3_BUCKET must be set when VIDEO_STORAGE=s3")
        return S3Storage(bucket=settings.s3_bucket, region=settings.s3_region, endpoint_url=settings.s3_endpoint_url)
    raise RuntimeError(f"Unsupported VIDEO_STORAGE={settings.video_storage!r}. Use 'local' or 's3'.")

