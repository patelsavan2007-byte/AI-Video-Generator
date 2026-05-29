"""
generate.py — Core AI Generation Engine
========================================
This module contains the reusable generation logic, fully decoupled from
the web framework.  It is designed to be imported by main.py (FastAPI) but
can also be run standalone for quick CLI testing.

Architecture
------------
    BaseGenerator          — shared helpers (device selection, directory setup)
        └── ImageGenerator — loads Stable Diffusion and produces images
        └── VideoGenerator — (stub) placeholder for future text-to-video work

The OOP layout makes it easy to add new generators (e.g. VideoGenerator)
without touching the API layer.
"""

from __future__ import annotations

import os
import uuid
import time
import logging
from pathlib import Path
from typing import Optional

import torch
from diffusers import StableDiffusionPipeline

# ---------------------------------------------------------------------------
# Logging — keeps the console output readable
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("ai_generator")


# ===================================================================== #
#                          BASE GENERATOR                                #
# ===================================================================== #
class BaseGenerator:
    """Shared setup used by every generator type."""

    def __init__(
        self,
        output_dir: str = "outputs",
        model_cache_dir: str = "models",
    ):
        # --- Directory setup ---------------------------------------------------
        # Create output and model-cache folders if they don't exist yet.
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.model_cache_dir = Path(model_cache_dir)
        self.model_cache_dir.mkdir(parents=True, exist_ok=True)

        # --- Device selection --------------------------------------------------
        # Automatically pick GPU (CUDA) when available; fall back to CPU.
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            self.dtype = torch.float16  # GPU → float16 saves VRAM
            logger.info("🚀  CUDA GPU detected — using GPU acceleration")
        else:
            self.device = torch.device("cpu")
            self.dtype = torch.float32  # CPU requires full-precision float32
            logger.info("💻  No CUDA GPU found — running on CPU (slower but works)")

    # Utility ----------------------------------------------------------------
    @staticmethod
    def _unique_filename(prefix: str = "gen", ext: str = ".png") -> str:
        """Return a collision-free filename like  gen_a3f7c9b2.png"""
        short_id = uuid.uuid4().hex[:8]
        return f"{prefix}_{short_id}{ext}"


# ===================================================================== #
#                         IMAGE GENERATOR                                #
# ===================================================================== #
class ImageGenerator(BaseGenerator):
    """
    Text-to-Image generation using Stable Diffusion v1.5.

    Usage:
        gen = ImageGenerator()
        gen.load_model()                       # call once at startup
        path = gen.generate("a cute cat")      # call per request
    """

    # Default model — good quality, small (~4 GB), huge community support.
    DEFAULT_MODEL_ID = "runwayml/stable-diffusion-v1-5"

    def __init__(
        self,
        model_id: Optional[str] = None,
        output_dir: str = "outputs",
        model_cache_dir: str = "models",
    ):
        super().__init__(output_dir=output_dir, model_cache_dir=model_cache_dir)
        self.model_id = model_id or self.DEFAULT_MODEL_ID
        self.pipeline: Optional[StableDiffusionPipeline] = None

    # ------------------------------------------------------------------
    # Model Loading
    # ------------------------------------------------------------------
    def load_model(self) -> None:
        """
        Download (first time only) and load the Stable Diffusion pipeline
        into memory.  Weights are cached inside ``self.model_cache_dir``
        so subsequent starts are fast.
        """
        if self.pipeline is not None:
            logger.info("Model already loaded — skipping.")
            return

        logger.info(
            "📥  Loading model '%s' (first run downloads ~4 GB) ...", self.model_id
        )

        # Load the full Stable Diffusion pipeline --------------------------------
        # • cache_dir  → stores weights locally so we don't re-download
        # • torch_dtype → float16 on GPU for speed, float32 on CPU for compat
        self.pipeline = StableDiffusionPipeline.from_pretrained(
            self.model_id,
            torch_dtype=self.dtype,
            cache_dir=str(self.model_cache_dir),
        )

        # Move pipeline to the chosen device (GPU or CPU) -----------------------
        self.pipeline.to(self.device)

        # --- Memory optimizations (critical for limited hardware) ---------------
        # Attention slicing reduces peak memory at a small speed cost.
        self.pipeline.enable_attention_slicing()

        # On CPU with limited RAM, offloading scheduler states helps too.
        logger.info("✅  Model loaded and ready on %s", self.device)

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------
    def unload_model(self) -> None:
        """Release the model from memory (useful on shutdown)."""
        if self.pipeline is not None:
            del self.pipeline
            self.pipeline = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("🧹  Model unloaded and memory freed.")

    # ------------------------------------------------------------------
    # Image Generation
    # ------------------------------------------------------------------
    def generate(
        self,
        prompt: str,
        negative_prompt: str = "blurry, bad quality, distorted, ugly, low resolution",
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        width: int = 512,
        height: int = 512,
    ) -> dict:
        """
        Generate an image from a text prompt.

        Parameters
        ----------
        prompt : str
            The text description of the image to create.
        negative_prompt : str
            Things to avoid in the output (improves quality).
        num_inference_steps : int
            More steps → higher quality but slower.  20-50 is typical.
        guidance_scale : float
            How strictly to follow the prompt (7-8 is a good balance).
        width, height : int
            Output resolution (must be multiples of 8; 512×512 default).

        Returns
        -------
        dict with keys: filename, filepath, generation_time_sec
        """
        if self.pipeline is None:
            raise RuntimeError(
                "Model not loaded. Call load_model() before generating."
            )

        logger.info("🎨  Generating image for prompt: '%s'", prompt)
        start = time.time()

        # --- Run the diffusion pipeline ----------------------------------------
        result = self.pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height,
        )

        # The pipeline returns a list of PIL Image objects ----------------------
        image = result.images[0]
        elapsed = round(time.time() - start, 2)

        # --- Save the generated image ------------------------------------------
        filename = self._unique_filename(prefix="img")
        filepath = self.output_dir / filename
        image.save(str(filepath))

        logger.info("💾  Image saved → %s  (took %.2fs)", filepath, elapsed)

        return {
            "filename": filename,
            "filepath": str(filepath),
            "generation_time_sec": elapsed,
        }


# ===================================================================== #
#                    VIDEO GENERATOR  (Future Stub)                      #
# ===================================================================== #
class VideoGenerator(BaseGenerator):
    """
    Placeholder for future Text-to-Video generation.

    When ready, this class will load a video diffusion model
    (e.g. Stable Video Diffusion, Wan2.2, or AnimateDiff) and expose
    a .generate() method with the same interface pattern as ImageGenerator.
    """

    def load_model(self) -> None:
        raise NotImplementedError(
            "VideoGenerator is a future feature — not yet implemented."
        )

    def generate(self, prompt: str, **kwargs) -> dict:
        raise NotImplementedError(
            "VideoGenerator is a future feature — not yet implemented."
        )


# ===================================================================== #
#                        STANDALONE CLI TEST                             #
# ===================================================================== #
if __name__ == "__main__":
    """
    Quick smoke test — run directly:
        python generate.py

    This will load the model and generate a sample image to verify
    everything works before starting the API server.
    """
    print("\n" + "=" * 60)
    print("  AI Image Generator — Standalone Test")
    print("=" * 60 + "\n")

    gen = ImageGenerator()
    gen.load_model()

    result = gen.generate(
        prompt="A beautiful sunset over a calm ocean, digital art, 4k, vibrant colors"
    )

    print(f"\n✅  Test complete!")
    print(f"   Image saved to : {result['filepath']}")
    print(f"   Generation time: {result['generation_time_sec']}s\n")
