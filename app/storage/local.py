from __future__ import annotations

import os
from pathlib import Path

from app.storage.base import PutResult, Storage


class LocalStorage(Storage):
    def __init__(self, root_dir: str):
        self._root_dir = Path(root_dir)
        self._root_dir.mkdir(parents=True, exist_ok=True)

    def put_bytes(self, object_key: str, content: bytes, content_type: str) -> PutResult:
        path = self._root_dir / object_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return PutResult(object_key=object_key)

    def local_path_for(self, object_key: str) -> str | None:
        path = self._root_dir / object_key
        return str(path)

    def presigned_get_url(self, object_key: str, expires_in_seconds: int) -> str | None:
        return None

