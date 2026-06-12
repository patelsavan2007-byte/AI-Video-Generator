"""
Celery task: generate_video

Two execution paths:
  DEBUG_MODE=true  — generates a dummy black MP4 using ffmpeg with no GPU
  DEBUG_MODE=false — runs real Wan2.x diffusion inference on GPU
"""
import os
import time
import socket
import subprocess
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from worker_app import celery_app
from core.config import settings
from db.models import GenJob, Video, JobStatus

# Synchronous DB engine for the Celery worker (not async)
_sync_url = settings.POSTGRES_URL.replace("+asyncpg", "+psycopg2").replace(
    "postgresql+asyncpg", "postgresql"
)
# Actually use psycopg2 sync driver
import re
_sync_url = re.sub(r'^postgresql\+asyncpg', 'postgresql+psycopg2', settings.POSTGRES_URL)

try:
    sync_engine = create_engine(_sync_url, pool_pre_ping=True)
    SyncSession = sessionmaker(sync_engine)
except Exception as e:
    print(f"[worker] DB engine init failed: {e}")
    sync_engine = None
    SyncSession = None

# Redis client for progress updates
try:
    _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    _redis = None

# ── Model singleton (production only) ──────────────────────────────
_pipeline = None

def _load_pipeline(is_img2vid: bool = False):
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    if settings.DEBUG_MODE:
        return None
    try:
        import torch
        # Try to import Wan2 — adjust import path based on actual package name
        try:
            from wan import WanT2V, WanI2V  # type: ignore
            model_path = settings.WAN2_MODEL_PATH
            if is_img2vid:
                _pipeline = WanI2V.from_pretrained(model_path)
            else:
                _pipeline = WanT2V.from_pretrained(model_path)
        except ImportError:
            # Fallback: try diffusers pipeline
            from diffusers import DiffusionPipeline  # type: ignore
            _pipeline = DiffusionPipeline.from_pretrained(
                settings.WAN2_MODEL_PATH,
                torch_dtype=torch.float16,
            ).to("cuda")
    except Exception as exc:
        print(f"[worker] Model load failed: {exc}")
        _pipeline = None
    return _pipeline


def _set_progress(job_id: str, pct: int):
    if _redis:
        try:
            _redis.setex(f"job:{job_id}:progress", 120, str(pct))
        except Exception:
            pass


def _get_db() -> Session:
    return SyncSession()


def _update_job_status(db: Session, job_id: str, video_id: str, status: JobStatus,
                       **kwargs):
    job = db.query(GenJob).filter(GenJob.job_id == job_id).first()
    video = db.query(Video).filter(Video.id == video_id).first()
    if job:
        for k, v in kwargs.items():
            if hasattr(job, k):
                setattr(job, k, v)
    if video:
        video.status = status
    db.commit()


@celery_app.task(name="tasks.video.generate_video", bind=True, max_retries=2, default_retry_delay=15)
def generate_video(
    self,
    job_id: str,
    video_id: str,
    prompt: str,
    negative_prompt: Optional[str] = None,
    duration: float = 4.0,
    fps: int = 16,
    resolution: str = "512x512",
    seed: Optional[int] = None,
    aspect_ratio: str = "16:9",
    init_image_url: Optional[str] = None,
):
    """Main Celery task. Runs either DEBUG_MODE (dummy MP4) or real inference."""
    start_time = time.time()
    db = _get_db()

    try:
        # Mark as processing
        worker_id = f"{socket.gethostname()}-{os.getpid()}"
        _update_job_status(
            db, job_id, video_id, JobStatus.processing,
            worker_id=worker_id, progress=0
        )
        _set_progress(job_id, 0)

        # Prepare output paths
        now = datetime.now(timezone.utc)
        year, month = now.strftime("%Y"), now.strftime("%m")
        video_dir = Path(settings.MEDIA_ROOT) / "videos" / year / month
        video_dir.mkdir(parents=True, exist_ok=True)
        thumb_dir = Path(settings.MEDIA_ROOT) / "thumbnails"
        thumb_dir.mkdir(parents=True, exist_ok=True)
        inter_dir = Path(settings.MEDIA_ROOT) / "intermediates" / job_id
        inter_dir.mkdir(parents=True, exist_ok=True)

        output_path = video_dir / f"{job_id}.mp4"
        thumb_path = thumb_dir / f"{job_id}.jpg"

        if settings.DEBUG_MODE:
            _run_debug_path(job_id, output_path, thumb_path, inter_dir)
        else:
            _run_production_path(
                job_id, output_path, thumb_path, inter_dir,
                prompt, negative_prompt, duration, fps, resolution,
                seed, aspect_ratio, init_image_url,
            )

        # Clean up intermediates
        if inter_dir.exists():
            shutil.rmtree(inter_dir, ignore_errors=True)

        gpu_sec = time.time() - start_time
        video_url = f"/media/videos/{year}/{month}/{job_id}.mp4"
        thumbnail_url = f"/media/thumbnails/{job_id}.jpg"

        # Update DB to completed
        job = db.query(GenJob).filter(GenJob.job_id == job_id).first()
        video = db.query(Video).filter(Video.id == video_id).first()
        if job:
            job.progress = 100
            job.gpu_sec = round(gpu_sec, 2)
            job.cost_usd = round(gpu_sec * 0.0003, 4)  # rough estimate
            job.completed_at = datetime.now(timezone.utc)
        if video:
            video.status = JobStatus.completed
            video.video_url = video_url
            video.thumbnail_url = thumbnail_url
        db.commit()
        _set_progress(job_id, 100)

    except Exception as exc:
        error_msg = str(exc)[:1000]
        _update_job_status(
            db, job_id, video_id, JobStatus.failed, error_msg=error_msg
        )
        _set_progress(job_id, -1)
        print(f"[worker] Job {job_id} failed: {exc}")
        # Retry for transient errors (not OOM)
        if "OutOfMemoryError" not in type(exc).__name__:
            raise self.retry(exc=exc)
    finally:
        db.close()


def _run_debug_path(job_id: str, output_path: Path, thumb_path: Path, inter_dir: Path):
    """DEBUG_MODE: generate a dummy MP4 using ffmpeg, simulate progress."""
    print(f"[worker-debug] Starting debug generation for job {job_id}")

    # Simulate progress over ~5 seconds
    for pct in range(0, 91, 10):
        _set_progress(job_id, pct)
        time.sleep(0.5)

    # Generate a 5-second black video with text using ffmpeg
    try:
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "color=c=0x1a0a2e:size=512x512:duration=5:rate=24",
            "-vf", f"drawtext=text='VisionForge Debug\\nJob: {job_id[:8]}':fontsize=18:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-t", "5",
            str(output_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            # Fallback: simpler command without drawtext (in case fonts not available)
            cmd_simple = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", "color=c=0x1a0a2e:size=512x512:duration=5:rate=24",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                str(output_path)
            ]
            subprocess.run(cmd_simple, check=True, capture_output=True, timeout=30)
    except Exception as e:
        raise RuntimeError(f"ffmpeg failed: {e}")

    # Generate thumbnail from first frame
    _generate_thumbnail(output_path, thumb_path)
    _set_progress(job_id, 95)


def _run_production_path(
    job_id: str, output_path: Path, thumb_path: Path, inter_dir: Path,
    prompt: str, negative_prompt: Optional[str], duration: float, fps: int,
    resolution: str, seed: Optional[int], aspect_ratio: str, init_image_url: Optional[str],
):
    """Production path: run Wan2.x diffusion inference on GPU."""
    import torch  # type: ignore

    try:
        is_img2vid = init_image_url is not None
        pipeline = _load_pipeline(is_img2vid=is_img2vid)
        if pipeline is None:
            raise RuntimeError("Model not loaded")

        # Parse resolution
        w, h = map(int, resolution.split("x"))
        num_frames = int(duration * fps)

        # Set seed
        generator = None
        if seed is not None:
            generator = torch.Generator(device="cuda").manual_seed(seed)

        # Progress callback
        step_count = [0]
        num_steps = 30  # Wan2.x default

        def progress_callback(step, timestep, latents):
            step_count[0] += 1
            pct = int((step_count[0] / num_steps) * 90)
            _set_progress(job_id, pct)

        # Run inference
        if is_img2vid:
            from PIL import Image  # type: ignore
            import httpx
            # Load init image
            img_path = Path(settings.MEDIA_ROOT) / init_image_url.lstrip("/media/")
            if img_path.exists():
                init_image = Image.open(img_path).convert("RGB").resize((w, h))
            else:
                init_image = Image.new("RGB", (w, h), (0, 0, 0))

            output = pipeline(
                image=init_image,
                prompt=prompt,
                negative_prompt=negative_prompt or "",
                num_frames=num_frames,
                width=w, height=h,
                num_inference_steps=num_steps,
                generator=generator,
                callback=progress_callback,
                callback_steps=1,
            )
        else:
            output = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt or "",
                num_frames=num_frames,
                width=w, height=h,
                num_inference_steps=num_steps,
                generator=generator,
                callback=progress_callback,
                callback_steps=1,
            )

        # Save frames to intermediates
        frames = output.frames[0] if hasattr(output, "frames") else output.images
        for i, frame in enumerate(frames):
            frame.save(inter_dir / f"frame_{i:04d}.png")

        _set_progress(job_id, 92)

        # Encode to MP4
        _encode_frames_to_mp4(inter_dir, output_path, fps)
        _generate_thumbnail(output_path, thumb_path)
        _set_progress(job_id, 98)

    except torch.cuda.OutOfMemoryError as oom:
        torch.cuda.empty_cache()
        raise RuntimeError(f"GPU out of memory: {oom}")


def _encode_frames_to_mp4(frames_dir: Path, output_path: Path, fps: int):
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%04d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "23",
        str(output_path)
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)


def _generate_thumbnail(video_path: Path, thumb_path: Path):
    """Extract first frame as 480p JPEG thumbnail."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vframes", "1",
        "-vf", "scale=854:480:force_original_aspect_ratio=decrease",
        "-q:v", "3",
        str(thumb_path)
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=30)
    except Exception:
        # Fallback: use Pillow to create a black thumbnail
        from PIL import Image  # type: ignore
        img = Image.new("RGB", (854, 480), (26, 10, 46))
        img.save(str(thumb_path), "JPEG", quality=85)
