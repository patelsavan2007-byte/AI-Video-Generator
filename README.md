# VisionForge 2.0 🎬

> AI Text-to-Video generation service powered by Wan2.x diffusion model.

## Architecture

```
Browser (Next.js 14)
    │  HTTPS · REST · JWT
    ▼
FastAPI Backend  ──── PostgreSQL 15 (users, videos, gen_jobs)
    │                 Redis 7       (sessions, progress cache)
    │  Celery task enqueue
    ▼
Redis Broker ──── Celery Queue (video_gen)
    │
    ▼
Celery Workers (GPU: RTX 3090/4090) · DEBUG_MODE: CPU only
    │  Wan2.x diffusion · 30–50 steps
    ▼
Local Filesystem /media/ (Docker volume)
    │  MP4 output · JPEG thumbnails
    ▼
Nginx (zero-copy static serving)
```

## Quick Start

### 1. Copy environment file

```bash
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY
```

### 2. Start in DEBUG mode (no GPU needed)

This runs the full stack but generates dummy MP4s instead of real inference:

```bash
docker compose -f infra/docker-compose.yml --profile debug up --build
```

Open http://localhost:80 (Nginx) or:
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

### 3. Start with real GPU inference

```bash
# Make sure WAN2_MODEL_PATH in .env points to your model weights
docker compose -f infra/docker-compose.yml --profile gpu up --build
```

### 4. Run frontend + backend without Docker (dev)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Worker (debug mode):**
```bash
cd backend
DEBUG_MODE=true celery -A worker_app worker -Q video_gen --concurrency=2 --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
visionforge/
├── backend/              # FastAPI + Celery
│   ├── main.py           # App entrypoint
│   ├── core/             # Config, security
│   ├── db/               # SQLAlchemy models, session, Alembic migrations
│   ├── routers/          # auth, generate, jobs, media
│   ├── schemas/          # Pydantic request/response schemas
│   ├── tasks/            # Celery task (video generation)
│   └── worker_app.py     # Celery app instance
├── frontend/             # Next.js 14 (App Router)
├── worker/               # GPU worker Dockerfile
├── infra/
│   ├── docker-compose.yml
│   └── nginx/nginx.conf
└── .env.example
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user, returns JWT |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |
| POST | `/v1/generate` | Submit video generation job |
| POST | `/v1/upload-image` | Upload init image (img2vid) |
| GET | `/v1/jobs/{id}` | Get job status + progress |
| DELETE | `/v1/jobs/{id}` | Cancel job |
| POST | `/v1/jobs/{id}/rerun` | Rerun with new seed |
| GET | `/v1/videos` | List user's videos |
| GET | `/media/videos/{y}/{m}/{file}` | Stream MP4 (206 range support) |
| GET | `/health` | Health check |

## DEBUG_MODE

Set `DEBUG_MODE=true` in `.env` to skip GPU/model loading entirely. The worker will:
1. Simulate progress updates every 0.5s (10 steps over ~5s)
2. Generate a dummy dark-purple MP4 using `ffmpeg -f lavfi`
3. Create a thumbnail
4. Complete the job normally

This lets you test the full UI → API → queue → worker → poll → playback flow without any GPU.

## Database

Uses SQLAlchemy async with PostgreSQL 15. Tables are auto-created at startup (`create_all`).

For schema migrations run:
```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_URL` | `postgresql+asyncpg://vf:secret@postgres:5432/visionforge` | Database URL |
| `REDIS_URL` | `redis://redis:6379/0` | Redis URL |
| `SECRET_KEY` | `changeme...` | JWT signing key (change in production!) |
| `MEDIA_ROOT` | `/media` | Root path for media files |
| `WAN2_MODEL_PATH` | `/models/wan2` | Path to Wan2.x weights |
| `MAX_CONCURRENT_JOBS` | `2` | Celery worker concurrency |
| `DEBUG_MODE` | `false` | Skip GPU inference, use dummy MP4 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend → API base URL |
