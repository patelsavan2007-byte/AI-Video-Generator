"""
VisionForge 2.0 — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.session import create_tables
from routers import auth, generate, jobs, media


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    await create_tables()
    print(f"[startup] VisionForge API ready | DEBUG_MODE={settings.DEBUG_MODE}")
    yield
    # Shutdown
    print("[shutdown] VisionForge API shutting down")


app = FastAPI(
    title="VisionForge 2.0 API",
    description="AI Text-to-Video generation service",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(jobs.router)
app.include_router(media.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "debug_mode": settings.DEBUG_MODE}
