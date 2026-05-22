from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PutResult:
    object_key: str


class Storage(Protocol):
    def put_bytes(self, object_key: str, content: bytes, content_type: str) -> PutResult: ...

    def local_path_for(self, object_key: str) -> str | None: ...

    def presigned_get_url(self, object_key: str, expires_in_seconds: int) -> str | None: ...

