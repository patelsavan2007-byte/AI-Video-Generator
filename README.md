# hf_ttv_provider

Production-style system design for an **asynchronous Text/Image → Video generation API** built around:

- Hugging Face `InferenceClient` (provider: `fal-ai`)
- Model: `Wan-AI/Wan2.2-TI2V-5B`

## Docs

- `docs/system_design.md` - architecture, data model, workers, storage, ops
- `docs/endpoints.md` - API contract for `/generate`, `/status/{job_id}`, `/video/{job_id}`

## Local Dev (Docker Compose)

- Copy `.env.example` to `.env` and set `HF_TOKEN`
- Run: `docker compose up --build`
- API: `http://localhost:8000`

## Local Dev (No Docker)

- Install deps: `pip install -r requirements.txt`
- Start API: `scripts/run_api.ps1`
- Start worker: `scripts/run_worker.ps1`
- You still need Redis + a DB (or set `DATABASE_URL=sqlite:///./data/app.db` for local-only testing).
