# GPU Worker — requires NVIDIA Container Toolkit on the Docker host
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Install ffmpeg and psycopg2 dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (includes psycopg2 for sync SQLAlchemy in worker)
RUN pip install --no-cache-dir \
    celery[redis]>=5.4.0 \
    redis>=5.0.4 \
    sqlalchemy>=2.0.30 \
    psycopg2-binary>=2.9.9 \
    pydantic>=2.7.0 \
    pydantic-settings>=2.2.0 \
    Pillow>=10.3.0 \
    ffmpeg-python>=0.2.0 \
    aiofiles>=23.2.1 \
    diffusers>=0.27.0 \
    transformers>=4.40.0 \
    accelerate>=0.29.0

# Wan2 model library (install if available on PyPI, else comment out)
# RUN pip install wan2

COPY ../backend /app

CMD ["celery", "-A", "worker_app", "worker", "-Q", "video_gen", "--concurrency=2", "--loglevel=info"]
