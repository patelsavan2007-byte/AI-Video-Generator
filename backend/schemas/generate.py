from pydantic import BaseModel, Field
from typing import Optional


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    duration: float = Field(4.0, ge=1.0, le=30.0)
    fps: int = Field(16, ge=8, le=60)
    resolution: str = Field("512x512", pattern=r"^\d+x\d+$")
    seed: Optional[int] = Field(None, ge=0, le=2**32 - 1)
    aspect_ratio: str = Field("16:9", pattern=r"^\d+:\d+$")
    init_image_url: Optional[str] = Field(None, max_length=500)  # img2vid


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    message: str = "Job queued successfully"


class UploadImageResponse(BaseModel):
    upload_id: str
    url: str
