"""Booking provider adapters.

The router hands off to the right adapter based on `course.booking_provider`.
The internal adapter owns its tee-sheet table; external adapters proxy the
upstream club system. All adapters implement the same interface (`Provider`).
"""
from __future__ import annotations

from app.services.providers.base import Provider, ProviderError, ProviderSlot
from app.services.providers.internal import InternalProvider
from app.services.providers.golfbox import GolfBoxProvider
from app.services.providers.gimmie import GimmieProvider
from app.services.providers.teeone import TeeOneProvider
from app.services.providers.chronogolf import ChronogolfProvider


_REGISTRY: dict[str, type[Provider]] = {
    "internal": InternalProvider,
    "golfbox": GolfBoxProvider,
    "gimmie": GimmieProvider,
    "teeone": TeeOneProvider,
    "chronogolf": ChronogolfProvider,
}


def get_provider(name: str | None) -> Provider:
    """Resolve a provider by name (defaults to internal)."""
    cls = _REGISTRY.get((name or "internal").lower(), InternalProvider)
    return cls()


__all__ = [
    "Provider",
    "ProviderError",
    "ProviderSlot",
    "get_provider",
]
