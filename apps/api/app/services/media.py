from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse, Response

from app.config import get_settings


ALLOWED_AUDIO_EXTENSIONS = {".caf", ".m4a", ".wav", ".aac", ".mp3"}


@dataclass(frozen=True)
class StoredAudio:
    url: str
    content_type: str
    byte_count: int


def normalized_audio_ext(suffix: str) -> str:
    ext = suffix.lower()
    return ext if ext in ALLOWED_AUDIO_EXTENSIONS else ".caf"


def audio_key(kind: str, user_id: UUID, parent_id: UUID, shot_id: UUID, suffix: str) -> str:
    return f"{kind}/{user_id}/{parent_id}/{shot_id}{normalized_audio_ext(suffix)}"


async def store_audio(kind: str, user_id: UUID, parent_id: UUID, shot_id: UUID, suffix: str, data: bytes, content_type: str | None) -> StoredAudio:
    settings = get_settings()
    media_type = content_type or "audio/x-caf"
    key = audio_key(kind, user_id, parent_id, shot_id, suffix)

    if settings.media_storage.lower() == "vercel_blob":
        if not settings.blob_read_write_token:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Blob storage is not configured")
        response = await httpx.AsyncClient(timeout=30.0).put(
            f"https://blob.vercel-storage.com/{key}",
            headers={
                "authorization": f"Bearer {settings.blob_read_write_token}",
                "content-type": media_type,
                "x-api-version": "7",
            },
            content=data,
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Audio upload failed")
        payload = response.json()
        return StoredAudio(
            url=payload.get("url") or payload.get("downloadUrl") or "",
            content_type=media_type,
            byte_count=len(data),
        )

    path = Path(settings.media_root) / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return StoredAudio(url="", content_type=media_type, byte_count=len(data))


def file_audio_response(kind: str, user_id: UUID, parent_id: UUID, shot_id: UUID) -> Response:
    directory = Path(get_settings().media_root) / kind / str(user_id) / str(parent_id)
    matches = list(directory.glob(f"{shot_id}.*"))
    if not matches:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found")
    path = matches[0]
    media_type = "audio/x-caf" if path.suffix.lower() == ".caf" else None
    return FileResponse(path, media_type=media_type, filename=path.name)


def audio_response_from_metadata(audio: dict | None, kind: str, user_id: UUID, parent_id: UUID, shot_id: UUID) -> Response:
    if isinstance(audio, dict):
        url = audio.get("url")
        if isinstance(url, str) and url.startswith("https://"):
            return RedirectResponse(url)
    return file_audio_response(kind, user_id, parent_id, shot_id)


def delete_user_media(user_id: UUID) -> None:
    """Best-effort removal of filesystem-backed media for account deletion.

    Vercel Blob URLs are public object URLs without a stored pathname in the
    current schema, so production Blob deletion should be completed by object
    lifecycle policy or a future media index. The local filesystem backend can
    be removed deterministically by user directory.
    """
    settings = get_settings()
    if settings.media_storage.lower() != "filesystem":
        return

    root = Path(settings.media_root)
    for kind in ("range-sessions", "rounds"):
        user_dir = root / kind / str(user_id)
        if not user_dir.exists():
            continue
        for path in sorted(user_dir.rglob("*"), reverse=True):
            if path.is_file():
                path.unlink(missing_ok=True)
            elif path.is_dir():
                try:
                    path.rmdir()
                except OSError:
                    pass
        try:
            user_dir.rmdir()
        except OSError:
            pass
