from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    prompt: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_msg: Optional[str] = None
    duration: float
    fps: int
    resolution: str
    seed: Optional[int] = None
    aspect_ratio: str
    init_image_url: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    gpu_sec: Optional[float] = None
    cost_usd: Optional[float] = None


class VideoListItem(BaseModel):
    id: str
    job_id: str
    prompt: str
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    status: str
    created_at: datetime
    duration: float
    resolution: str
