"""
main.py — FastAPI Server for AI Image Generation
=================================================
This is the entry point of the backend.  It exposes a REST API that
accepts text prompts and returns AI-generated images.

Run the server
--------------
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Then test with
--------------
    POST http://127.0.0.1:8000/api/v1/generate-image
    Body: {"prompt": "A futuristic samurai walking in neon Tokyo"}
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

import torch

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import our generation engine (lives in generate.py)
from generate import ImageGenerator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("api")


# ---------------------------------------------------------------------------
# Paths — resolved relative to this file so it works from any working dir
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = BASE_DIR / "outputs"
MODELS_DIR = BASE_DIR / "models"


# ---------------------------------------------------------------------------
# Pydantic Models — strict request / response validation
# ---------------------------------------------------------------------------
class GenerateImageRequest(BaseModel):
    """What the client sends to start a generation."""

    prompt: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Text description of the image to generate.",
        json_schema_extra={"example": "A futuristic samurai walking in neon Tokyo"},
    )
    negative_prompt: str = Field(
        default="blurry, bad quality, distorted, ugly, low resolution",
        description="Things to avoid in the generated image.",
    )
    steps: int = Field(
        default=30,
        ge=10,
        le=100,
        description="Number of diffusion steps (more = better quality, slower).",
    )
    guidance_scale: float = Field(
        default=7.5,
        ge=1.0,
        le=20.0,
        description="How closely to follow the prompt (7-8 recommended).",
    )
    width: int = Field(default=512, ge=256, le=1024, description="Image width in px.")
    height: int = Field(
        default=512, ge=256, le=1024, description="Image height in px."
    )


class GenerateImageResponse(BaseModel):
    """What the server returns after generation."""

    status: str
    message: str
    data: dict


# ---------------------------------------------------------------------------
# Application Lifespan — load model on startup, free on shutdown
# ---------------------------------------------------------------------------
# We store the generator instance here so the endpoint can use it.
image_generator: ImageGenerator | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan handler.

    Startup:  Load the Stable Diffusion model into memory once, so every
              API request reuses the warm model (no reload overhead).
    Shutdown: Free GPU/CPU memory cleanly.
    """
    global image_generator

    logger.info("🚀  Starting AI Generation Server ...")

    # --- Startup: Warm up the model -----------------------------------------
    image_generator = ImageGenerator(
        output_dir=str(OUTPUTS_DIR),
        model_cache_dir=str(MODELS_DIR),
    )
    image_generator.load_model()

    logger.info("✅  Server is ready to generate images!")

    yield  # ← Server runs here, handling requests

    # --- Shutdown: Clean up -------------------------------------------------
    logger.info("🛑  Shutting down — releasing model from memory ...")
    if image_generator is not None:
        image_generator.unload_model()
    logger.info("👋  Server stopped cleanly.")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Image Generation API",
    description=(
        "Generate stunning images from text prompts using Stable Diffusion. "
        "Part of the AI Text-to-Video Generation system."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# Serve the outputs/ folder so generated images can be viewed in a browser
# e.g.  http://localhost:8000/outputs/img_a3f7c9b2.png
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Quick health check — is the server alive?"""
    return {
        "status": "online",
        "service": "AI Image Generation API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health status including model readiness."""
    return {
        "status": "healthy",
        "model_loaded": image_generator is not None
        and image_generator.pipeline is not None,
        "device": str(image_generator.device) if image_generator else "not started",
    }


# ---------------------------------------------------------------------------
# POST /api/v1/generate-image  — The Main Endpoint
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/generate-image",
    response_model=GenerateImageResponse,
    tags=["Generation"],
    summary="Generate an image from a text prompt",
)
async def generate_image(request: GenerateImageRequest):
    """
    **Generate an AI image from a text prompt.**

    Send a JSON body with a `prompt` field describing the image you want.
    The server runs Stable Diffusion and returns the path to the saved image.

    Example request:
    ```json
    {
        "prompt": "A futuristic samurai walking in neon Tokyo"
    }
    ```
    """

    # --- Guard: Is the model ready? ----------------------------------------
    if image_generator is None or image_generator.pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model is still loading. Please wait a moment and retry.",
        )

    try:
        # --- Run the generation pipeline ------------------------------------
        logger.info("📨  Received generation request: '%s'", request.prompt)

        result = image_generator.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.steps,
            guidance_scale=request.guidance_scale,
            width=request.width,
            height=request.height,
        )

        # --- Build the response ---------------------------------------------
        # Provide both the local path and a direct URL to view the image.
        image_url = f"/outputs/{result['filename']}"

        return GenerateImageResponse(
            status="success",
            message=f"Image generated in {result['generation_time_sec']}s",
            data={
                "filename": result["filename"],
                "filepath": result["filepath"],
                "url": image_url,
                "generation_time_sec": result["generation_time_sec"],
                "prompt": request.prompt,
            },
        )

    except torch.cuda.OutOfMemoryError:
        # GPU ran out of memory — inform the user clearly.
        logger.error("💥  GPU out of memory!")
        raise HTTPException(
            status_code=507,
            detail=(
                "GPU ran out of memory. Try reducing the image size "
                "(width/height) or number of steps."
            ),
        )

    except RuntimeError as exc:
        logger.error("💥  Runtime error during generation: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(exc)}",
        )

    except Exception as exc:
        logger.error("💥  Unexpected error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Check server logs for details.",
        )


# ---------------------------------------------------------------------------
# Run with:  python main.py   (alternative to uvicorn CLI)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("  AI Image Generation API Server")
    print("  Docs -> http://127.0.0.1:8000/docs")
    print("=" * 60 + "\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
