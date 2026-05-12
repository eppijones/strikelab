"""Payments — Vipps (NO default) + Stripe (international fallback)."""
from app.services.payments.base import (
    PaymentError,
    PaymentInitiation,
    PaymentResult,
    PaymentStatus,
)
from app.services.payments.vipps import VippsClient
from app.services.payments.stripe_client import StripeClient


def select(method: str, country_code: str | None = None):
    """Resolve a payment client by method (and country for sensible defaults)."""
    method = (method or "").lower()
    if method == "vipps":
        return VippsClient()
    if method in ("card", "stripe", "apple_pay", "applepay"):
        return StripeClient()
    if (country_code or "").upper() == "NO":
        return VippsClient()
    return StripeClient()


__all__ = [
    "PaymentError",
    "PaymentInitiation",
    "PaymentResult",
    "PaymentStatus",
    "VippsClient",
    "StripeClient",
    "select",
]
