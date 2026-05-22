# Endpoints - Video Generation API

This API is asynchronous. `POST /generate` returns a `job_id` immediately; clients poll `GET /status/{job_id}` and then fetch the result via `GET /video/{job_id}`.

Base response fields (recommended):

```json
{
  "job_id": "uuid",
  "status": "IN_PROGRESS",
  "created_at": "2026-05-21T10:30:00Z",
  "updated_at": "2026-05-21T10:30:05Z",
  "error": null
}
```

Status values:

- `IN_PROGRESS`
- `COMPLETED`
- `ERROR`

---

## 1) POST `/generate`

Create a new job and enqueue background generation.

### Request JSON

```json
{
  "prompt": "A young man walking on the street",
  "params": {
    "seed": 123
  }
}
```

Fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `prompt` | string | yes | 1..2000 chars (recommended) |
| `params` | object | no | Forwarded to the model/provider adapter |

### Response (202)

```json
{
  "job_id": "a1b2c3d4-1111-2222-3333-444455556666",
  "status": "IN_PROGRESS"
}
```

### Status codes

- `202` accepted
- `400` invalid JSON
- `422` validation error
- `429` rate limited

### Notes (idempotency recommended)

Support an `Idempotency-Key` header so retries return the same job.

---

## 2) GET `/status/{job_id}`

Return job status.

### Response (200)

```json
{
  "job_id": "a1b2c3d4-1111-2222-3333-444455556666",
  "status": "IN_PROGRESS",
  "created_at": "2026-05-21T10:30:00Z",
  "updated_at": "2026-05-21T10:30:05Z",
  "error": null
}
```

If `ERROR`, include an error object:

```json
{
  "job_id": "a1b2c3d4-1111-2222-3333-444455556666",
  "status": "ERROR",
  "error": { "code": "GENERATION_FAILED", "message": "Model timeout" }
}
```

### Status codes

- `200` found
- `404` unknown `job_id`

---

## 3) GET `/video/{job_id}`

Fetch the generated video.

### If `COMPLETED`

Mode A (local storage): stream bytes

- `200`
- `Content-Type: video/mp4`

Mode B (object storage): return a signed URL (recommended for production)

```json
{
  "job_id": "a1b2c3d4-1111-2222-3333-444455556666",
  "status": "COMPLETED",
  "download_url": "https://storage.example/signed-url",
  "expires_in_seconds": 900
}
```

### If `IN_PROGRESS`

```json
{
  "status": "IN_PROGRESS",
  "message": "Video not ready yet"
}
```

### If `ERROR`

```json
{
  "status": "ERROR",
  "message": "Generation failed"
}
```

### Status codes (recommended)

- `200` completed (bytes or signed URL)
- `404` unknown job
- `409` not ready yet
- `422` job failed

---

## 4) Operational Endpoints (recommended)

- `GET /healthz` liveness
- `GET /readyz` readiness (DB + Redis connectivity)

