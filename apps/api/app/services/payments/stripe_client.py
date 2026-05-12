"""Stripe client for non-NO bookings.

Thin wrapper around Stripe's REST API; only the surface we need (PaymentIntent
create + capture). When `STRIPE_SECRET_KEY` is missing we degrade to a stub
that mimics a captured payment, so the booking flow works end-to-end in dev.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional

import httpx

from app.config import get_settings
from app.services.payments.base import (
    PaymentError,
    PaymentInitiation,
    PaymentResult,
    PaymentStatus,
)

logger = logging.getLogger(__name__)


class StripeClient:
    name = "stripe"

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.stripe_secret_key)

    def initiate(
        self,
        *,
        amount: float,
        currency: str = "NOK",
        booking_id: Optional[str] = None,
        customer_email: Optional[str] = None,
    ) -> PaymentInitiation:
        if not self.is_configured:
            payment_id = f"stripe-stub-{uuid.uuid4().hex[:12]}"
            return PaymentInitiation(
                method=self.name,
                payment_id=payment_id,
                client_secret=f"{payment_id}_secret_stub",
                status=PaymentStatus.AUTHORIZED,
            )
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    "https://api.stripe.com/v1/payment_intents",
                    auth=(self.settings.stripe_secret_key, ""),
                    data={
                        "amount": int(round(amount * 100)),
                        "currency": currency.lower(),
                        "automatic_payment_methods[enabled]": "true",
                        **(
                            {"metadata[booking_id]": booking_id}
                            if booking_id
                            else {}
                        ),
                        **(
                            {"receipt_email": customer_email}
                            if customer_email
                            else {}
                        ),
                    },
                )
                r.raise_for_status()
                payload = r.json()
        except httpx.HTTPError as exc:
            raise PaymentError(f"Stripe initiate failed: {exc}") from exc

        return PaymentInitiation(
            method=self.name,
            payment_id=payload["id"],
            client_secret=payload["client_secret"],
            status=PaymentStatus.PENDING,
        )

    def capture(self, payment_id: str, amount: float, currency: str = "NOK") -> PaymentResult:
        if not self.is_configured:
            return PaymentResult(
                method=self.name,
                payment_id=payment_id,
                status=PaymentStatus.CAPTURED,
                amount=amount,
                currency=currency,
                raw={"stub": True},
            )
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    f"https://api.stripe.com/v1/payment_intents/{payment_id}/capture",
                    auth=(self.settings.stripe_secret_key, ""),
                )
                r.raise_for_status()
                payload = r.json()
        except httpx.HTTPError as exc:
            raise PaymentError(f"Stripe capture failed: {exc}") from exc

        return PaymentResult(
            method=self.name,
            payment_id=payment_id,
            status=PaymentStatus.CAPTURED,
            amount=amount,
            currency=currency,
            raw=payload,
        )
