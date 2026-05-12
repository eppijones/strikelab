"""GolfBox provider stub.

Phase 2: implements OAuth2 + the GolfBox `Starttidsbestilling` API once the
partnership with GolfBox AS is in place. For V1 we keep the file so the
adapter registry resolves, but every method raises a clear `ProviderError`
asking the caller to pick the internal provider.

Norwegian club system; widely deployed across NGF clubs (Nordic).
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.booking import BookingHold
from app.models.course import Course
from app.models.user import User
from app.services.providers.base import (
    Provider,
    ProviderConfirmation,
    ProviderError,
    ProviderHold,
    ProviderSlot,
)


class GolfBoxProvider(Provider):
    name = "golfbox"

    def list_slots(
        self, db: Session, course: Course, target_date: date
    ) -> list[ProviderSlot]:
        raise ProviderError(
            "GolfBox integration is Phase 2 — partnership pending. "
            "Set course.booking_provider='internal' for now."
        )

    def hold(
        self,
        db: Session,
        user: User,
        course: Course,
        slot_id: Optional[UUID],
        tee_time: datetime,
        players: int,
        provider_ref: Optional[str] = None,
    ) -> ProviderHold:
        raise ProviderError("GolfBox hold not available in V1")

    def confirm(
        self,
        db: Session,
        user: User,
        hold: BookingHold,
        payment_ref: Optional[str],
    ) -> ProviderConfirmation:
        raise ProviderError("GolfBox confirm not available in V1")

    def cancel(self, db: Session, user: User, booking_ref: str) -> bool:
        raise ProviderError("GolfBox cancel not available in V1")
