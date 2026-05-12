"""Internal provider — StrikeLab hosts the tee sheet directly.

This is the only fully-implemented provider in V1. It reads/writes
`tee_sheets` + `tee_sheet_slots` from Postgres. External providers (GolfBox,
Gimmie, etc.) inherit the same interface but currently only stub out their
methods until partnership credentials land.
"""
from __future__ import annotations

import secrets
import string
from datetime import date, datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.booking import BookingHold, TeeSheet, TeeSheetSlot
from app.models.course import Course
from app.models.user import User
from app.services.providers.base import (
    Provider,
    ProviderConfirmation,
    ProviderError,
    ProviderHold,
    ProviderSlot,
)


HOLD_TTL_MIN = 10


def _generate_check_in_code() -> str:
    """6-char base32-ish check-in code with center separator (e.g. MK·24)."""
    chars = string.ascii_uppercase + string.digits
    body = "".join(secrets.choice(chars) for _ in range(4))
    return f"{body[:2]}·{body[2:]}"


class InternalProvider(Provider):
    name = "internal"

    def list_slots(
        self, db: Session, course: Course, target_date: date
    ) -> list[ProviderSlot]:
        sheet = (
            db.query(TeeSheet)
            .filter(TeeSheet.course_id == course.id, TeeSheet.date == target_date)
            .first()
        )
        if not sheet:
            return []
        out: list[ProviderSlot] = []
        for s in sheet.slots:
            out.append(
                ProviderSlot(
                    tee_time=s.tee_time,
                    players_total=s.players_total,
                    players_taken=s.players_taken,
                    price_amount=s.price_amount,
                    currency=s.currency,
                    peak=s.peak,
                    golden=s.golden,
                    twilight=s.twilight,
                    is_blocked=s.is_blocked,
                    provider_ref=str(s.id),
                    restrictions=s.restrictions or {},
                )
            )
        return out

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
        slot: Optional[TeeSheetSlot] = None
        if slot_id is not None:
            slot = db.query(TeeSheetSlot).filter(TeeSheetSlot.id == slot_id).first()
            if slot is None:
                raise ProviderError("Slot not found")
            if slot.is_blocked:
                raise ProviderError("Slot blocked")
            if slot.players_taken + players > slot.players_total:
                raise ProviderError("Not enough seats remaining")
        return ProviderHold(
            provider=self.name,
            provider_ref=str(slot.id) if slot else provider_ref,
            expires_at=datetime.utcnow() + timedelta(minutes=HOLD_TTL_MIN),
            slot_id=slot.id if slot else None,
        )

    def confirm(
        self,
        db: Session,
        user: User,
        hold: BookingHold,
        payment_ref: Optional[str],
    ) -> ProviderConfirmation:
        # Update slot occupancy if we tracked one.
        if hold.slot_id:
            slot = (
                db.query(TeeSheetSlot)
                .filter(TeeSheetSlot.id == hold.slot_id)
                .first()
            )
            if slot is not None:
                slot.players_taken = min(
                    slot.players_total, slot.players_taken + max(1, hold.players)
                )
        return ProviderConfirmation(
            provider=self.name,
            provider_ref=hold.provider_ref,
            confirmation_code=_generate_check_in_code(),
            payment_status="captured",
        )

    def cancel(self, db: Session, user: User, booking_ref: str) -> bool:
        # Internal cancel is just status update on the booking row; the slot's
        # `players_taken` decrement is handled by the router so it can write to
        # both rows in a single transaction.
        return True
