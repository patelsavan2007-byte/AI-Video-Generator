from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core
    database_url: str = Field(default="sqlite:///./data/app.db", alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # Celery (defaults to redis_url if unset)
    celery_broker_url: str | None = Field(default=None, alias="CELERY_BROKER_URL")
    celery_result_backend: str | None = Field(default=None, alias="CELERY_RESULT_BACKEND")

    # HF / Provider
    hf_token: str | None = Field(default=None, alias="HF_TOKEN")
    hf_provider: str = Field(default="fal-ai", alias="HF_PROVIDER")
    hf_model: str = Field(default="Wan-AI/Wan2.2-TI2V-5B", alias="HF_MODEL")

    # Storage
    video_storage: str = Field(default="local", alias="VIDEO_STORAGE")  # local | s3
    local_video_dir: str = Field(default="./data/videos", alias="LOCAL_VIDEO_DIR")

    s3_bucket: str | None = Field(default=None, alias="S3_BUCKET")
    s3_prefix: str = Field(default="videos/", alias="S3_PREFIX")
    s3_region: str | None = Field(default=None, alias="S3_REGION")
    s3_endpoint_url: str | None = Field(default=None, alias="S3_ENDPOINT_URL")
    signed_url_ttl_seconds: int = Field(default=900, alias="SIGNED_URL_TTL_SECONDS")

    def resolved_celery_broker_url(self) -> str:
        return self.celery_broker_url or self.redis_url

    def resolved_celery_result_backend(self) -> str:
        return self.celery_result_backend or self.redis_url

    def normalized_s3_prefix(self) -> str:
        prefix = self.s3_prefix or ""
        if prefix and not prefix.endswith("/"):
            prefix += "/"
        return prefix


settings = Settings()
