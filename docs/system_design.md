# System Design - Asynchronous Video Generation API

This system provides an asynchronous API for video generation using:

- Hugging Face `InferenceClient`
- Inference provider: `fal-ai`
- Model: `Wan-AI/Wan2.2-TI2V-5B`

Video generation is slow, so the API is built around background jobs.

---

## 1) Architecture

Components:

- API server (FastAPI): request validation, job creation, status + retrieval endpoints
- Job DB (PostgreSQL recommended): source of truth for job state
- Task queue (Redis + Celery): decouples HTTP from long-running generation
- Workers (Celery): run model calls, store artifacts, update DB
- Storage:
  - local filesystem (dev)
  - object storage (recommended for prod: S3/R2/GCS/Azure Blob)

High-level diagram:

```text
Client
  |
  v
API Server  ----->  Postgres (jobs table)
  |
  v
Redis Queue -----> Celery Worker -----> Storage (Local or Object)
```

---

## 2) Job Lifecycle

Happy path:

1. Client calls `POST /generate`.
2. API inserts a `jobs` row with `status=IN_PROGRESS`.
3. API enqueues `{job_id}` to the queue.
4. Worker dequeues, loads job, sets `started_at`, increments attempts.
5. Worker calls HF provider to generate the video.
6. Worker writes `videos/{job_id}.mp4` to storage.
7. Worker updates job to `COMPLETED` and stores artifact pointer(s).
8. Client polls `GET /status/{job_id}` until `COMPLETED`.
9. Client downloads via `GET /video/{job_id}` (stream or signed URL).

Failure path:

- Worker retries transient failures.
- Only when retries are exhausted does the job become `ERROR`.

---

## 3) Data Model

### Jobs table (recommended)

```sql
CREATE TABLE jobs (
  job_id            UUID PRIMARY KEY,
  prompt            TEXT NOT NULL,
  status            VARCHAR(20) NOT NULL,

  video_path        TEXT,
  video_object_key  TEXT,

  error_code        TEXT,
  error_message     TEXT,

  model             TEXT NOT NULL,
  provider          TEXT NOT NULL,
  request_params    JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_meta       JSONB NOT NULL DEFAULT '{}'::jsonb,

  attempts          INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);
```

Status values:

- `IN_PROGRESS`
- `COMPLETED`
- `ERROR`

### Optional tables (recommended)

Idempotency keys:

```sql
CREATE TABLE idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  job_id          UUID NOT NULL REFERENCES jobs(job_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Transactional outbox (if you want strict enqueue reliability):

```sql
CREATE TABLE job_outbox (
  id         BIGSERIAL PRIMARY KEY,
  job_id     UUID NOT NULL REFERENCES jobs(job_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at    TIMESTAMPTZ
);
```

---

## 4) Queue and Worker Design

Key properties:

- At-least-once delivery: tasks can run more than once; writes must be idempotent.
- Deterministic artifact key: `videos/{job_id}.mp4`.
- Conditional DB updates: do not overwrite `COMPLETED` from a duplicate delivery.
- Time limits: prevent stuck workers.
- Retries: exponential backoff + max attempts.

Celery tuning (typical defaults to consider):

- `acks_late=True`
- `worker_prefetch_multiplier=1`
- `max_retries=3` (example)
- separate queue for long-running generation tasks

---

## 5) Storage

### Local storage (dev)

- Store files under `./data/videos/{job_id}.mp4`.
- `GET /video/{job_id}` streams from disk.

### Object storage (recommended for prod)

- Store `video_object_key` in DB (e.g., `videos/2026/05/{job_id}.mp4`).
- `GET /video/{job_id}` returns a signed URL (best for scale).
- Put a CDN in front for performance (optional).

---

## 6) Reliability and Operations

- Stuck job reaper: periodically detect jobs that have been `IN_PROGRESS` too long.
- Observability:
  - structured logs with `job_id`
  - metrics: queue depth, latency p50/p95/p99, error rates by `error_code`
- Security:
  - authentication (API key / JWT)
  - rate limiting on `/generate`
  - keep `HF_TOKEN` in a secrets manager, not in git

---

## 7) Deployment Notes

Minimal production topology:

- API: 2+ replicas behind a load balancer
- Redis: managed or dedicated instance
- Postgres: managed or dedicated instance
- Workers: autoscale based on queue depth + latency
- Storage: object storage + optional CDN

