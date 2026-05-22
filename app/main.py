from __future__ import annotations

from fastapi import FastAPI

from app.db.init_db import init_db
from app.api.routes import router as api_router


def create_app() -> FastAPI:
    app = FastAPI(title="HF Video Generation API", version="1.0.0")
    app.include_router(api_router)
    return app


app = create_app()


@app.on_event("startup")
def _startup() -> None:
    init_db()

