from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from core.config import settings

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/videos/{year}/{month}/{filename}")
async def serve_video(year: str, month: str, filename: str):
    """Stream MP4 with HTTP 206 range-request support (video seek)."""
    file_path = Path(settings.MEDIA_ROOT) / "videos" / year / month / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/thumbnails/{filename}")
async def serve_thumbnail(filename: str):
    file_path = Path(settings.MEDIA_ROOT) / "thumbnails" / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(path=str(file_path), media_type="image/jpeg")


@router.get("/uploads/{user_id}/{filename}")
async def serve_upload(user_id: str, filename: str):
    file_path = Path(settings.MEDIA_ROOT) / "uploads" / user_id / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(file_path))
