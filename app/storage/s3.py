from __future__ import annotations

import boto3

from app.storage.base import PutResult, Storage


class S3Storage(Storage):
    def __init__(self, *, bucket: str, region: str | None, endpoint_url: str | None):
        self._bucket = bucket
        self._client = boto3.client("s3", region_name=region, endpoint_url=endpoint_url)

    def put_bytes(self, object_key: str, content: bytes, content_type: str) -> PutResult:
        self._client.put_object(
            Bucket=self._bucket,
            Key=object_key,
            Body=content,
            ContentType=content_type,
        )
        return PutResult(object_key=object_key)

    def local_path_for(self, object_key: str) -> str | None:
        return None

    def presigned_get_url(self, object_key: str, expires_in_seconds: int) -> str | None:
        return self._client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self._bucket, "Key": object_key},
            ExpiresIn=expires_in_seconds,
        )

