"""
Razorpay billing integration (India) — creates Subscriptions for checkout
and a webhook receiver that keeps `subscriptions` in sync with real payment
events. This is the India-side counterpart to stripe_billing.py (global);
main.py routes a checkout request to one or the other based on the plan the
owner is paying for, chosen client-side (see BillingCard.tsx).
"""

from __future__ import annotations

import datetime
import hashlib
import hmac
import logging
import os
import time

try:
    import razorpay
except ImportError:
    razorpay = None

import db
from notifications import (
    send_payment_receipt_email,
    send_payment_failed_alert,
    send_subscription_canceled_email,
)

logger = logging.getLogger("ochreshift.razorpay_billing")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

_client: razorpay.Client | None = None

# Predefined Razorpay Plan IDs (INR, monthly and yearly).
# Can be overridden or supplied via environment variables:
#   RAZORPAY_PLAN_{PLAN}_{INTERVAL} (e.g. RAZORPAY_PLAN_STARTER_MONTH, RAZORPAY_PLAN_PRO_YEAR)
PLAN_INTERVAL_TO_RAZORPAY_PLAN_ID: dict[tuple[str, str], str] = {
    ("starter", "month"): os.getenv("RAZORPAY_PLAN_STARTER_MONTH", "plan_THfIQrwOGe2pNX"),
    ("starter", "year"): os.getenv("RAZORPAY_PLAN_STARTER_YEAR", "plan_THfIQrwOGe2pNX_annual"),
    ("pro", "month"): os.getenv("RAZORPAY_PLAN_PRO_MONTH", "plan_THfKz6LAULvcFX"),
    ("pro", "year"): os.getenv("RAZORPAY_PLAN_PRO_YEAR", "plan_THfKz6LAULvcFX_annual"),
    ("business", "month"): os.getenv("RAZORPAY_PLAN_BUSINESS_MONTH", "plan_THfBusinessMonth"),
    ("business", "year"): os.getenv("RAZORPAY_PLAN_BUSINESS_YEAR", "plan_THfBusinessYear"),
    ("enterprise", "month"): os.getenv("RAZORPAY_PLAN_ENTERPRISE_MONTH", "plan_THfMUsMzqGtz85"),
    ("enterprise", "year"): os.getenv("RAZORPAY_PLAN_ENTERPRISE_YEAR", "plan_THfMUsMzqGtz85_annual"),
}

_PLACEHOLDER_PLAN_IDS = {
    "plan_THfIQrwOGe2pNX_annual",
    "plan_THfKz6LAULvcFX_annual",
    "plan_THfBusinessMonth",
    "plan_THfBusinessYear",
    "plan_THfMUsMzqGtz85_annual",
}


def is_valid_plan_id(plan_id: str | None) -> bool:
    """True if plan_id is non-empty and not an explicit placeholder or mock string."""
    if not plan_id:
        return False
    if plan_id in _PLACEHOLDER_PLAN_IDS:
        return False
    if plan_id.endswith("_annual") or "Business" in plan_id:
        return False
    return True


def _log_plan_config_status() -> None:
    for (plan, interval), plan_id in PLAN_INTERVAL_TO_RAZORPAY_PLAN_ID.items():
        if not is_valid_plan_id(plan_id):
            logger.warning("[razorpay_billing] ⚠️ Plan '%s' (%s) has placeholder plan ID '%s' — checkout will fail", plan, interval, plan_id)
        else:
            logger.info("[razorpay_billing] ✓ Plan '%s' (%s) configured with plan ID '%s'", plan, interval, plan_id)


_log_plan_config_status()


def _get_client() -> razorpay.Client:
    global _client
    if _client is None:
        if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
            raise RuntimeError("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured")
        _client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return _client


def get_razorpay_plan_id(plan: str, interval: str = "month") -> str | None:
    norm_interval = "year" if interval in ("year", "annual", "yearly") else "month"
    env_name = f"RAZORPAY_PLAN_{plan.upper()}_{norm_interval.upper()}"
    env_val = os.getenv(env_name)
    if env_val:
        return env_val
    return PLAN_INTERVAL_TO_RAZORPAY_PLAN_ID.get((plan, norm_interval))


def create_subscription(
    plan: str,
    owner_user_id: str,
    owner_email: str | None = None,
    interval: str = "month",
) -> dict:
    """Creates a Razorpay Subscription for the caller to open Checkout
    against (Checkout.js, client-side — see BillingCard.tsx)."""
    if plan == "enterprise":
        raise ValueError("Enterprise plan requires custom high-throughput deployment. Please contact sales at sales@ochreshift.in")

    norm_interval = "year" if interval in ("year", "annual", "yearly") else "month"
    plan_id = get_razorpay_plan_id(plan, norm_interval)
    if not plan_id or not is_valid_plan_id(plan_id):
        raise ValueError(f"Plan '{plan}' ({norm_interval}) configuration is currently being provisioned. Please contact support.")

    total_count = 10 if norm_interval == "year" else 120

    sub = _get_client().subscription.create(
        {
            "plan_id": plan_id,
            "customer_notify": 1,
            "total_count": total_count,
            "notes": {
                "owner_user_id": owner_user_id,
                "plan": plan,
                "interval": norm_interval,
            },
        }
    )
    return {"subscriptionId": sub["id"], "keyId": RAZORPAY_KEY_ID}


def cancel_subscription(subscription_id: str, at_cycle_end: bool = True) -> dict:
    """Cancels an active Razorpay subscription."""
    return _get_client().subscription.cancel(
        subscription_id,
        data={"cancel_at_cycle_end": 1 if at_cycle_end else 0},
    )


def verify_payment_signature(
    razorpay_subscription_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """Verifies Razorpay subscription checkout signature returned to client-side callback."""
    if not RAZORPAY_KEY_SECRET or not razorpay_signature or not razorpay_payment_id:
        return False
    msg = f"{razorpay_payment_id}|{razorpay_subscription_id}"
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Razorpay's documented scheme: the `X-Razorpay-Signature` header is
    hex(HMAC-SHA256(webhook_secret, raw_body))."""
    if not RAZORPAY_WEBHOOK_SECRET or not signature_header:
        return False
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _epoch_to_iso(ts: int | None) -> str | None:
    if not ts:
        return None
    return datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).isoformat()


def handle_event(event: dict) -> None:
    """Update `subscriptions` from a verified Razorpay event with atomic idempotency, replay protection, and audit logging."""
    event_type = event.get("event", "")
    entity = ((event.get("payload") or {}).get("subscription") or {}).get("entity") or {}
    notes = entity.get("notes") or {}
    owner_user_id = notes.get("owner_user_id")

    event_id = event.get("id") or f"{event_type}_{entity.get('id')}_{event.get('created_at', '')}"

    # 1. Replay attack protection (stale event rejection)
    event_created = event.get("created_at")
    if event_created and abs(time.time() - float(event_created)) > 600:
        logger.warning("[razorpay_billing] Rejecting stale webhook event: %s (age > 600s)", event_id)
        if event_id:
            db.record_webhook_event("razorpay", event_id, event_type, owner_user_id, event, status="ignored", error_message="Event timestamp expired (replay protection)")
        return

    # 2. Atomic Idempotency lock
    if event_id:
        acquired = db.acquire_webhook_lock("razorpay", event_id, event_type, owner_user_id, event)
        if not acquired:
            logger.info("[razorpay_billing] Skipping already processed webhook event: %s (%s)", event_id, event_type)
            return

    if not owner_user_id:
        if event_id:
            db.record_webhook_event("razorpay", event_id, event_type, None, event, status="ignored")
        return

    # 3. Ownership verification against known subscription record
    sub_id = entity.get("id")
    if owner_user_id and sub_id:
        if not db.validate_subscription_ownership(owner_user_id, "razorpay", sub_id):
            logger.warning(
                "[razorpay_billing] Security: ownership validation failed for event %s: user %s does not own sub %s",
                event_id, owner_user_id, sub_id
            )
            if event_id:
                db.record_webhook_event("razorpay", event_id, event_type, owner_user_id, event, status="rejected_ownership", error_message="Subscription ownership mismatch")
            return

    plan = notes.get("plan", "unknown")
    interval = notes.get("interval", "month")

    try:
        if event_type in ("subscription.activated", "subscription.charged", "subscription.updated"):
            max_bots, max_msgs = db.PLAN_LIMITS.get(plan, db.PLAN_LIMITS["trial"])
            db.upsert_subscription_from_razorpay(
                owner_user_id=owner_user_id,
                plan=plan,
                status="active",
                max_bots=max_bots,
                max_messages_per_month=max_msgs,
                current_period_end=_epoch_to_iso(entity.get("current_end")),
                razorpay_subscription_id=entity.get("id"),
                razorpay_customer_id=entity.get("customer_id"),
                billing_interval=interval,
            )

            # Send payment receipt email with real amount and currency
            payment_payload = ((event.get("payload") or {}).get("payment") or {}).get("entity") or {}
            amt_paise = payment_payload.get("amount") or entity.get("paid_amount") or 0
            if amt_paise:
                amt = amt_paise / 100.0
            else:
                amt = 1999.0 if plan == "starter" else (4999.0 if plan == "pro" else 0.0)
                if interval == "year":
                    amt = amt * 10
            currency = payment_payload.get("currency") or entity.get("currency") or "INR"

            user_email = db.get_user_email(owner_user_id)
            if user_email:
                send_payment_receipt_email(user_email, plan, amt, currency=currency, interval=interval)

        elif event_type in ("subscription.cancelled", "subscription.completed"):
            db.upsert_subscription_from_razorpay(
                owner_user_id=owner_user_id,
                status="canceled",
                razorpay_subscription_id=entity.get("id"),
            )
            user_email = db.get_user_email(owner_user_id)
            if user_email:
                end_iso = _epoch_to_iso(entity.get("current_end"))
                send_subscription_canceled_email(user_email, plan, end_iso)

        elif event_type == "subscription.halted":
            db.upsert_subscription_from_razorpay(
                owner_user_id=owner_user_id,
                status="past_due",
                razorpay_subscription_id=entity.get("id"),
            )
            user_email = db.get_user_email(owner_user_id)
            if user_email:
                send_payment_failed_alert(user_email, plan)

        if event_id:
            db.record_webhook_event("razorpay", event_id, event_type, owner_user_id, event, status="processed")
    except Exception as e:
        logger.error("[razorpay_billing] Error handling webhook %s: %s", event_id, e, exc_info=True)
        if event_id:
            db.record_webhook_event("razorpay", event_id, event_type, owner_user_id, event, status="failed", error_message=str(e))
        raise

