"""
Stripe billing integration (global, non-India) — Checkout Sessions for
signup, Customer Portal sessions for self-serve management, and a webhook receiver
that keeps `subscriptions` in sync with real payment events. This is the global
counterpart to razorpay_billing.py (India); main.py routes a checkout request to
one or the other based on the chosen gateway and plan (see BillingCard.tsx).
"""

from __future__ import annotations

import datetime
import logging
import os

try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
except ImportError:
    stripe = None

import db
from notifications import (
    send_payment_receipt_email,
    send_payment_failed_alert,
    send_subscription_canceled_email,
)

logger = logging.getLogger("ochreshift.stripe_billing")

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Predefined Stripe recurring Price IDs.
# Can be overridden or supplied via environment variables:
#   STRIPE_PRICE_{PLAN}_{INTERVAL} (e.g. STRIPE_PRICE_STARTER_MONTH, STRIPE_PRICE_PRO_YEAR)
PLAN_INTERVAL_TO_STRIPE_PRICE_ID: dict[tuple[str, str], str] = {
    ("starter", "month"): os.getenv("STRIPE_PRICE_STARTER_MONTH", "price_1Twz6jBDUfmAcUQEKs1x7iVC"),
    ("starter", "year"): os.getenv("STRIPE_PRICE_STARTER_YEAR", "price_1Twz6jBDUfmAcUQEKs1x7iVC_annual"),
    ("pro", "month"): os.getenv("STRIPE_PRICE_PRO_MONTH", "price_1Twz8XBDUfmAcUQE03jR6x6A"),
    ("pro", "year"): os.getenv("STRIPE_PRICE_PRO_YEAR", "price_1Twz8XBDUfmAcUQE03jR6x6A_annual"),
    ("business", "month"): os.getenv("STRIPE_PRICE_BUSINESS_MONTH", "price_1TwzBusinessMonth"),
    ("business", "year"): os.getenv("STRIPE_PRICE_BUSINESS_YEAR", "price_1TwzBusinessYear"),
    ("enterprise", "month"): os.getenv("STRIPE_PRICE_ENTERPRISE_MONTH", "price_1Twz95BDUfmAcUQEWnodECQF"),
    ("enterprise", "year"): os.getenv("STRIPE_PRICE_ENTERPRISE_YEAR", "price_1Twz95BDUfmAcUQEWnodECQF_annual"),
}

_PLACEHOLDER_PRICE_IDS = {
    "price_1Twz6jBDUfmAcUQEKs1x7iVC_annual",
    "price_1Twz8XBDUfmAcUQE03jR6x6A_annual",
    "price_1TwzBusinessMonth",
    "price_1TwzBusinessYear",
    "price_1Twz95BDUfmAcUQEWnodECQF_annual",
}


def is_valid_price_id(price_id: str | None) -> bool:
    """True if price_id is non-empty and not an explicit placeholder or mock string."""
    if not price_id:
        return False
    if price_id in _PLACEHOLDER_PRICE_IDS:
        return False
    if price_id.endswith("_annual") or "Business" in price_id:
        return False
    return True


def _log_price_config_status() -> None:
    for (plan, interval), price_id in PLAN_INTERVAL_TO_STRIPE_PRICE_ID.items():
        if not is_valid_price_id(price_id):
            logger.warning("[stripe_billing] ⚠️ Plan '%s' (%s) has placeholder price ID '%s' — checkout will fail", plan, interval, price_id)
        else:
            logger.info("[stripe_billing] ✓ Plan '%s' (%s) configured with price ID '%s'", plan, interval, price_id)


_log_price_config_status()


def get_stripe_price_id(plan: str, interval: str = "month") -> str | None:
    norm_interval = "year" if interval in ("year", "annual", "yearly") else "month"
    env_name = f"STRIPE_PRICE_{plan.upper()}_{norm_interval.upper()}"
    env_val = os.getenv(env_name)
    if env_val:
        return env_val
    return PLAN_INTERVAL_TO_STRIPE_PRICE_ID.get((plan, norm_interval))


def create_checkout_session(
    plan: str,
    owner_user_id: str,
    owner_email: str | None,
    success_url: str,
    cancel_url: str,
    interval: str = "month",
) -> str:
    """Creates a Stripe Checkout Session (hosted page) and returns its URL."""
    if not stripe or not stripe.api_key:
        raise RuntimeError("Stripe API key is not configured.")

    if plan == "enterprise":
        raise ValueError("Enterprise plan requires custom high-throughput deployment. Please contact sales at sales@ochreshift.in")

    norm_interval = "year" if interval in ("year", "annual", "yearly") else "month"
    price_id = get_stripe_price_id(plan, norm_interval)
    if not price_id or not is_valid_price_id(price_id):
        raise ValueError(f"Plan '{plan}' ({norm_interval}) configuration is currently being provisioned. Please contact support.")

    metadata = {
        "owner_user_id": owner_user_id,
        "plan": plan,
        "interval": norm_interval,
    }

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=owner_user_id,
        customer_email=owner_email,
        subscription_data={"metadata": metadata},
        metadata=metadata,
        allow_promotion_codes=True,
    )
    return session.url


def create_customer_portal_session(stripe_customer_id: str, return_url: str) -> str:
    """Creates a self-serve Stripe Billing Customer Portal session."""
    if not stripe or not stripe.api_key:
        raise RuntimeError("Stripe API key is not configured.")
    portal_session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=return_url,
    )
    return portal_session.url


def cancel_subscription(stripe_subscription_id: str, at_period_end: bool = True) -> dict:
    """Cancels a Stripe subscription either at period end or immediately."""
    if not stripe or not stripe.api_key:
        raise RuntimeError("Stripe API key is not configured.")
    if at_period_end:
        return stripe.Subscription.modify(stripe_subscription_id, cancel_at_period_end=True)
    return stripe.Subscription.cancel(stripe_subscription_id)


def modify_subscription_plan(
    stripe_subscription_id: str,
    new_plan: str,
    new_interval: str = "month",
) -> dict:
    """Updates an existing subscription to a new plan/tier with immediate proration."""
    if not stripe or not stripe.api_key:
        raise RuntimeError("Stripe API key is not configured.")
    price_id = get_stripe_price_id(new_plan, new_interval)
    if not price_id or not is_valid_price_id(price_id):
        raise ValueError(f"Cannot switch to '{new_plan}' — invalid price ID.")
    sub = stripe.Subscription.retrieve(stripe_subscription_id)
    items = sub.get("items", {}).get("data", [])
    if not items:
        raise RuntimeError("No items found on subscription to modify.")
    item_id = items[0]["id"]
    metadata = dict(sub.get("metadata") or {})
    metadata.update({"plan": new_plan, "interval": new_interval})
    return stripe.Subscription.modify(
        stripe_subscription_id,
        items=[{"id": item_id, "price": price_id}],
        proration_behavior="always_invoice",
        metadata=metadata,
    )


def verify_and_parse_event(raw_body: bytes, signature_header: str | None) -> dict | None:
    """Verifies + decodes a Stripe webhook payload via Stripe's SDK."""
    if not STRIPE_WEBHOOK_SECRET or not signature_header or not stripe:
        return None
    try:
        return stripe.Webhook.construct_event(raw_body, signature_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        return None


def _epoch_to_iso(ts: int | None) -> str | None:
    if not ts:
        return None
    return datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).isoformat()


_STATUS_MAP = {
    "active": "active",
    "trialing": "trialing",
    "past_due": "past_due",
    "unpaid": "past_due",
    "incomplete": "past_due",
    "incomplete_expired": "canceled",
    "canceled": "canceled",
}


def handle_event(event: dict) -> None:
    """Update `subscriptions` and send emails from a verified Stripe event with atomic idempotency."""
    event_id = event.get("id")
    event_type = event.get("type", "")
    data = (event.get("data") or {}).get("object") or {}

    metadata = data.get("metadata") or (data.get("subscription_details") or {}).get("metadata") or {}
    owner_user_id = data.get("client_reference_id") or metadata.get("owner_user_id")

    # 1. Atomic Idempotency claim
    if event_id:
        acquired = db.acquire_webhook_lock("stripe", event_id, event_type, owner_user_id, event)
        if not acquired:
            logger.info("[stripe_billing] Skipping already processed webhook event: %s (%s)", event_id, event_type)
            return

    # 2. Ownership verification against known subscription record
    sub_id = data.get("subscription") if event_type in ("checkout.session.completed", "invoice.payment_failed", "invoice.payment_succeeded") else data.get("id")
    if owner_user_id and sub_id:
        if not db.validate_subscription_ownership(owner_user_id, "stripe", sub_id):
            logger.warning(
                "[stripe_billing] Security: ownership validation failed for event %s: user %s does not own sub %s",
                event_id, owner_user_id, sub_id
            )
            if event_id:
                db.record_webhook_event("stripe", event_id, event_type, owner_user_id, event, status="rejected_ownership", error_message="Subscription ownership mismatch")
            return

    try:
        if event_type == "checkout.session.completed":
            plan = metadata.get("plan", "unknown")
            interval = metadata.get("interval", "month")
            if owner_user_id:
                max_bots, max_msgs = db.PLAN_LIMITS.get(plan, db.PLAN_LIMITS["trial"])
                db.upsert_subscription_from_stripe(
                    owner_user_id=owner_user_id,
                    plan=plan,
                    status="active",
                    max_bots=max_bots,
                    max_messages_per_month=max_msgs,
                    stripe_subscription_id=data.get("subscription"),
                    stripe_customer_id=data.get("customer"),
                    billing_interval=interval,
                )
                customer_email = data.get("customer_details", {}).get("email") or data.get("customer_email")
                if customer_email:
                    amount_total = (data.get("amount_total") or 0) / 100.0
                    currency = (data.get("currency") or "usd").upper()
                    send_payment_receipt_email(customer_email, plan, amount_total, currency, interval)

        elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
            status = (
                "canceled"
                if event_type == "customer.subscription.deleted"
                else _STATUS_MAP.get(data.get("status"), "active")
            )
            plan = metadata.get("plan")
            interval = metadata.get("interval")
            max_bots, max_msgs = (None, None)
            if plan and plan in db.PLAN_LIMITS:
                max_bots, max_msgs = db.PLAN_LIMITS[plan]

            if owner_user_id:
                db.upsert_subscription_from_stripe(
                    owner_user_id=owner_user_id,
                    plan=plan,
                    status=status,
                    max_bots=max_bots,
                    max_messages_per_month=max_msgs,
                    current_period_end=_epoch_to_iso(data.get("current_period_end")),
                    stripe_subscription_id=data.get("id"),
                    stripe_customer_id=data.get("customer"),
                    billing_interval=interval,
                )
                if event_type == "customer.subscription.deleted" and plan:
                    end_iso = _epoch_to_iso(data.get("current_period_end"))
                    c_email = metadata.get("customer_email")
                    if c_email:
                        send_subscription_canceled_email(c_email, plan, end_iso)

        elif event_type == "invoice.payment_failed":
            customer_id = data.get("customer")
            subscription_id = data.get("subscription")
            customer_email = data.get("customer_email")
            plan = metadata.get("plan", "subscription")
            if owner_user_id:
                db.upsert_subscription_from_stripe(
                    owner_user_id=owner_user_id,
                    status="past_due",
                    stripe_subscription_id=subscription_id,
                    stripe_customer_id=customer_id,
                )
            if customer_email:
                send_payment_failed_alert(customer_email, plan)

        elif event_type == "invoice.payment_succeeded":
            customer_email = data.get("customer_email")
            lines = (data.get("lines") or {}).get("data") or []
            plan = "subscription"
            interval = "month"
            if lines and lines[0].get("metadata"):
                plan = lines[0]["metadata"].get("plan", plan)
                interval = lines[0]["metadata"].get("interval", interval)
            amount = (data.get("amount_paid") or 0) / 100.0
            currency = (data.get("currency") or "usd").upper()
            receipt_url = data.get("hosted_invoice_url")
            if customer_email and amount > 0:
                send_payment_receipt_email(customer_email, plan, amount, currency, interval, receipt_url)

        # Record successful processing
        if event_id:
            db.record_webhook_event("stripe", event_id, event_type, owner_user_id, event, status="processed")
    except Exception as e:
        logger.error("[stripe_billing] Error handling webhook %s: %s", event_id, e, exc_info=True)
        if event_id:
            db.record_webhook_event("stripe", event_id, event_type, owner_user_id, event, status="failed", error_message=str(e))
        raise

