from __future__ import annotations

from huggingface_hub import InferenceClient

from app.core.settings import settings


def _coerce_to_bytes(result) -> bytes:
    if isinstance(result, (bytes, bytearray, memoryview)):
        return bytes(result)
    if hasattr(result, "read"):
        return result.read()
    raise TypeError(f"Unsupported video result type: {type(result)!r}")


def generate_video_bytes(*, prompt: str, params: dict) -> bytes:
    if not settings.hf_token:
        raise RuntimeError("HF_TOKEN is required for upstream generation.")

    client = InferenceClient(provider=settings.hf_provider, token=settings.hf_token)

    result = client.text_to_video(
        prompt=prompt,
        model=settings.hf_model,
        **(params or {}),
    )
    return _coerce_to_bytes(result)

