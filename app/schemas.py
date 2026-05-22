from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    params: dict[str, Any] = Field(default_factory=dict)


class ErrorObject(BaseModel):
    code: str
    message: str


class JobResponse(BaseModel):
    job_id: str
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    error: ErrorObject | None = None


class GenerateResponse(BaseModel):
    job_id: str
    status: str


class VideoNotReadyResponse(BaseModel):
    status: str = "IN_PROGRESS"
    message: str = "Video not ready yet"


class VideoErrorResponse(BaseModel):
    status: str = "ERROR"
    message: str = "Generation failed"


class VideoSignedUrlResponse(BaseModel):
    job_id: str
    status: str = "COMPLETED"
    download_url: str
    expires_in_seconds: int

