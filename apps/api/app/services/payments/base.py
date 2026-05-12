"""Shared payment types."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class PaymentStatus(str, Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class PaymentInitiation:
    method: str  # vipps | stripe | apple_pay
    payment_id: str  # Vipps orderId / Stripe PaymentIntent id
    redirect_url: Optional[str] = None  # Vipps app-switch URL
    client_secret: Optional[str] = None  # Stripe PaymentIntent client secret
    status: PaymentStatus = PaymentStatus.INITIATED


@dataclass
class PaymentResult:
    method: str
    payment_id: str
    status: PaymentStatus
    amount: float
    currency: str = "NOK"
    raw: Optional[dict] = None


class PaymentError(RuntimeError):
    """Raised when a payment cannot be initiated or captured."""
