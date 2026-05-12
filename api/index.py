import os
import sys
from pathlib import Path


API_ROOT = Path(__file__).resolve().parents[1] / "apps" / "api"
sys.path.insert(0, str(API_ROOT))
os.environ.setdefault("MEDIA_STORAGE", "vercel_blob")

from app.main import app  # noqa: E402


class StripApiPrefix:
    def __init__(self, wrapped):
        self.wrapped = wrapped

    async def __call__(self, scope, receive, send):
        if scope.get("type") in {"http", "websocket"}:
            path = scope.get("path", "")
            if path == "/api":
                scope = {**scope, "path": "/"}
            elif path.startswith("/api/"):
                scope = {**scope, "path": path[4:]}
        await self.wrapped(scope, receive, send)


app = StripApiPrefix(app)
