"""Chronogolf provider stub (LightSpeed; large North American footprint)."""
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


class ChronogolfProvider(Provider):
    name = "chronogolf"

    def list_slots(
        self, db: Session, course: Course, target_date: date
    ) -> list[ProviderSlot]:
        raise ProviderError("Chronogolf integration is Phase 2 — partnership pending")

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
        raise ProviderError("Chronogolf hold not available in V1")

    def confirm(
        self,
        db: Session,
        user: User,
        hold: BookingHold,
        payment_ref: Optional[str],
    ) -> ProviderConfirmation:
        raise ProviderError("Chronogolf confirm not available in V1")

    def cancel(self, db: Session, user: User, booking_ref: str) -> bool:
        raise ProviderError("Chronogolf cancel not available in V1")
