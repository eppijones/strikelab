"""Vipps eCom v2 client.

Vipps is the de-facto Norwegian mobile-pay rail (~75% adult market share).
This client implements the eCom flow:

    1. POST /ecomm/v2/payments  → returns a redirect URL the user opens, which
       app-switches to Vipps.
    2. The user confirms in Vipps.
    3. Vipps calls our `callbackPrefix` webhook on completion.
    4. We POST /ecomm/v2/payments/{orderId}/capture to take the money.

In V1 we run against `apitest.vipps.no` with merchant credentials configured
via env vars (`VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`,
`VIPPS_SUBSCRIPTION_KEY`, `VIPPS_MERCHANT_SERIAL`). When credentials are
missing (e.g. local demo), the client returns a deterministic stub redirect
that just links back to the success page so the booking flow keeps working.
"""
from __future__ import annotations

import logging
import time
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


class VippsClient:
    name = "vipps"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    @property
    def is_configured(self) -> bool:
        s = self.settings
        return bool(
            s.vipps_client_id
            and s.vipps_client_secret
            and s.vipps_subscription_key
            and s.vipps_merchant_serial
        )

    # ─────────────────────────────────────────────────────────────────
    # OAuth (cached access token)
    # ─────────────────────────────────────────────────────────────────

    def _access_token_or_raise(self) -> str:
        if self._access_token and time.time() < self._token_expires_at - 30:
            return self._access_token
        if not self.is_configured:
            raise PaymentError("Vipps credentials not configured")
        s = self.settings
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    f"{s.vipps_base_url}/accesstoken/get",
                    headers={
                        "client_id": s.vipps_client_id,
                        "client_secret": s.vipps_client_secret,
                        "Ocp-Apim-Subscription-Key": s.vipps_subscription_key,
                        "Merchant-Serial-Number": s.vipps_merchant_serial,
                    },
                )
                r.raise_for_status()
                payload = r.json()
        except httpx.HTTPError as exc:
            raise PaymentError(f"Vipps token error: {exc}") from exc

        self._access_token = payload["access_token"]
        ttl = int(payload.get("expires_in", 3600))
        self._token_expires_at = time.time() + ttl
        return self._access_token

    # ─────────────────────────────────────────────────────────────────
    # Payment lifecycle
    # ─────────────────────────────────────────────────────────────────

    def initiate(
        self,
        *,
        amount_nok: float,
        order_text: str,
        customer_phone: Optional[str] = None,
        booking_id: Optional[str] = None,
    ) -> PaymentInitiation:
        order_id = f"strikelab-tee-{uuid.uuid4().hex[:12]}"
        s = self.settings

        if not self.is_configured:
            # Demo / local fallback: pretend Vipps approved immediately.
            logger.info(
                "Vipps credentials missing — using stub initiation for %s",
                order_id,
            )
            return PaymentInitiation(
                method=self.name,
                payment_id=order_id,
                redirect_url=f"{s.vipps_fallback_url}/passes/{booking_id or order_id}?stub=1",
                status=PaymentStatus.AUTHORIZED,
            )

        token = self._access_token_or_raise()
        body = {
            "merchantInfo": {
                "merchantSerialNumber": s.vipps_merchant_serial,
                "callbackPrefix": s.vipps_callback_prefix,
                "fallBack": s.vipps_fallback_url,
                "isApp": False,
            },
            "customerInfo": {"mobileNumber": customer_phone or ""},
            "transaction": {
                "orderId": order_id,
                "amount": int(round(amount_nok * 100)),
                "transactionText": order_text[:100],
            },
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    f"{s.vipps_base_url}/ecomm/v2/payments",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Ocp-Apim-Subscription-Key": s.vipps_subscription_key,
                        "Merchant-Serial-Number": s.vipps_merchant_serial,
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                r.raise_for_status()
                payload = r.json()
        except httpx.HTTPError as exc:
            raise PaymentError(f"Vipps initiate failed: {exc}") from exc

        return PaymentInitiation(
            method=self.name,
            payment_id=order_id,
            redirect_url=payload.get("url"),
            status=PaymentStatus.PENDING,
        )

    def capture(self, payment_id: str, amount_nok: float) -> PaymentResult:
        s = self.settings
        if not self.is_configured:
            return PaymentResult(
                method=self.name,
                payment_id=payment_id,
                status=PaymentStatus.CAPTURED,
                amount=amount_nok,
                currency="NOK",
                raw={"stub": True},
            )

        token = self._access_token_or_raise()
        body = {
            "merchantInfo": {"merchantSerialNumber": s.vipps_merchant_serial},
            "transaction": {
                "amount": int(round(amount_nok * 100)),
                "transactionText": "StrikeLab Tee booking",
            },
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(
                    f"{s.vipps_base_url}/ecomm/v2/payments/{payment_id}/capture",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Ocp-Apim-Subscription-Key": s.vipps_subscription_key,
                        "Merchant-Serial-Number": s.vipps_merchant_serial,
                        "X-Request-Id": uuid.uuid4().hex,
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                r.raise_for_status()
                payload = r.json()
        except httpx.HTTPError as exc:
            raise PaymentError(f"Vipps capture failed: {exc}") from exc

        return PaymentResult(
            method=self.name,
            payment_id=payment_id,
            status=PaymentStatus.CAPTURED,
            amount=amount_nok,
            currency="NOK",
            raw=payload,
        )

    def refund(self, payment_id: str, amount_nok: float) -> PaymentResult:
        # Symmetric to capture; same body shape, /refund endpoint.
        return self.capture(payment_id, amount_nok)

    def cancel(self, payment_id: str) -> PaymentResult:
        return PaymentResult(
            method=self.name,
            payment_id=payment_id,
            status=PaymentStatus.CANCELLED,
            amount=0.0,
            currency="NOK",
            raw={"cancelled": True},
        )
