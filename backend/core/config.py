from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore'
    )

    # Database
    POSTGRES_URL: str = "postgresql+asyncpg://vf:secret@localhost:5432/visionforge"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production-please"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Storage
    MEDIA_ROOT: str = "/media"

    # Worker / Model
    WAN2_MODEL_PATH: str = "/models/wan2"
    MAX_CONCURRENT_JOBS: int = 2

    # Debug mode — skips GPU/model, returns dummy MP4
    DEBUG_MODE: bool = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
