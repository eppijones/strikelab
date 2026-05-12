"""Realtime fanout — WebSocket endpoint that pushes round/shot updates
to every device a user has open (web tab, iOS app, future watch).

Single in-memory broker. Fine for a single API replica (dev, single-node
Fly.io); for multi-replica prod swap the broadcast path for Redis pub/sub.

Auth: the first WS message must be `{"type": "auth", "token": "<jwt>"}`.
The client may also pass `?token=...` in the query string; the query
form is convenient for browsers since `WebSocket` doesn't let you set
Authorization headers.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.services.auth import decode_any_token

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Per-user WebSocket registry. Each user can have multiple sockets
    (web tab + iOS app + future watch); a broadcast hits all of them.
    """

    def __init__(self) -> None:
        self._sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            self._sockets[user_id].add(ws)

    async def disconnect(self, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            if user_id in self._sockets:
                self._sockets[user_id].discard(ws)
                if not self._sockets[user_id]:
                    del self._sockets[user_id]

    async def broadcast(self, user_id: str, message: dict[str, Any]) -> None:
        """Send `message` to every live socket belonging to `user_id`.
        Dead sockets are pruned silently. Safe to call from sync code
        via `asyncio.run` if needed, but most call sites are already
        inside FastAPI's running loop.
        """
        sockets = list(self._sockets.get(user_id, ()))
        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                if ws.application_state == WebSocketState.CONNECTED:
                    await ws.send_text(json.dumps(message))
                else:
                    dead.append(ws)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._sockets.get(user_id, set()).discard(ws)


manager = ConnectionManager()


def _user_id_from_token(token: str | None) -> str | None:
    if not token:
        return None
    payload = decode_any_token(token)
    if not payload:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


@router.websocket("/ws/rounds")
async def rounds_ws(websocket: WebSocket) -> None:
    """Subscribe to the authenticated user's round/shot updates.

    The connection is accepted before authentication so the client can
    surface a clean error if the token is bad; we then immediately read
    one auth frame and close on failure. Tokens may also be passed as
    `?token=` to avoid the first-message handshake on the browser.
    """
    await websocket.accept()

    user_id = _user_id_from_token(websocket.query_params.get("token"))

    if user_id is None:
        try:
            raw = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
            msg = json.loads(raw)
            if msg.get("type") == "auth":
                user_id = _user_id_from_token(msg.get("token"))
        except (asyncio.TimeoutError, json.JSONDecodeError, WebSocketDisconnect):
            user_id = None

    if user_id is None:
        await websocket.close(code=4401, reason="unauthorized")
        return

    await manager.connect(user_id, websocket)
    await websocket.send_text(json.dumps({"type": "connected", "user_id": user_id}))
    try:
        while True:
            # We don't expect inbound messages today, but keep the loop
            # alive so disconnects are detected promptly. Clients may
            # send `{"type": "ping"}` and we'll echo a pong.
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("realtime ws error for user %s", user_id)
    finally:
        await manager.disconnect(user_id, websocket)


def broadcast_round_event(user_id: str | Any, event_type: str, round_id: Any, **extra: Any) -> None:
    """Sync entry point for REST handlers to fan out an event.

    Schedules the broadcast on the running loop. Callers don't need to
    await — fire and continue with their HTTP response.
    """
    payload = {
        "type": event_type,
        "round_id": str(round_id),
        **extra,
    }
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop (sync context outside FastAPI). Run a fresh
        # one — broadcast is best-effort.
        asyncio.run(manager.broadcast(str(user_id), payload))
        return
    loop.create_task(manager.broadcast(str(user_id), payload))
