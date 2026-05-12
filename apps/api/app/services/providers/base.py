"""Shared interface every booking provider implements."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.booking import BookingHold, TeeSheet
from app.models.course import Course
from app.models.user import User


class ProviderError(RuntimeError):
    """Raised when a provider call cannot be fulfilled."""


@dataclass
class ProviderSlot:
    """Provider-neutral slot representation."""

    tee_time: datetime
    players_total: int = 4
    players_taken: int = 0
    price_amount: Optional[float] = None
    currency: str = "NOK"
    peak: bool = False
    golden: bool = False
    twilight: bool = False
    is_blocked: bool = False
    provider_ref: Optional[str] = None
    restrictions: dict[str, Any] = field(default_factory=dict)

    @property
    def available(self) -> int:
        return max(0, self.players_total - self.players_taken)


class Provider(ABC):
    """Abstract booking provider."""

    name: str = "internal"

    @abstractmethod
    def list_slots(
        self, db: Session, course: Course, target_date: date
    ) -> list[ProviderSlot]:
        """Return all slots the course is selling on `target_date`."""

    @abstractmethod
    def hold(
        self,
        db: Session,
        user: User,
        course: Course,
        slot_id: Optional[UUID],
        tee_time: datetime,
        players: int,
        provider_ref: Optional[str] = None,
    ) -> "ProviderHold":
        """Reserve the slot (provider may emit its own ref)."""

    @abstractmethod
    def confirm(
        self,
        db: Session,
        user: User,
        hold: BookingHold,
        payment_ref: Optional[str],
    ) -> "ProviderConfirmation":
        """Convert the hold into a confirmed booking on the upstream system."""

    @abstractmethod
    def cancel(self, db: Session, user: User, booking_ref: str) -> bool:
        """Cancel an existing booking. Returns True if upstream confirmed."""


@dataclass
class ProviderHold:
    provider: str
    provider_ref: Optional[str]
    expires_at: datetime
    slot_id: Optional[UUID] = None


@dataclass
class ProviderConfirmation:
    provider: str
    provider_ref: Optional[str]
    confirmation_code: Optional[str]
    payment_status: str = "captured"
