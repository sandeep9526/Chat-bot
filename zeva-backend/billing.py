"""
Paddle billing integration — webhook receiver that keeps `subscriptions`
in sync with real payment events.

STATUS: structurally complete, NOT live-tested — there is no Paddle account
for this project yet, so nothing here has been exercised against Paddle's
real servers. Signature verification IS self-tested (see the note on
verify_signature) since that only requires the shared-secret scheme, not a
live account. Before going live:
  1. Create a Paddle account, a product + price, and a webhook subscription
     (Paddle dashboard → Developer Tools → Notifications) pointed at
     POST {API_URL}/billing/paddle-webhook.
  2. Set PADDLE_WEBHOOK_SECRET (from that notification's settings) in .env.
  3. Use Paddle's webhook simulator to fire each event type below and watch
     zeva.db... err, Neon's `subscriptions` table update correctly — do not
     trust this file's event-shape assumptions until you've seen a real
     payload; Paddle's docs are the source of truth at integration time.

Checkout itself (the actual "pay now" UI) is NOT built here. Paddle Billing's
current recommended integration is client-side Paddle.js (an overlay
checkout), not a server-built URL — that's a frontend task (see
fortend/src/components/billing/), not something this backend module does.
"""

import hashlib
import hmac
import os
import time

import db

PADDLE_WEBHOOK_SECRET = os.getenv("PADDLE_WEBHOOK_SECRET")

# Paddle plan (price) IDs → our internal plan names + limits. Fill these in
# once real prices exist in the Paddle dashboard.
PRICE_TO_PLAN = {
    # "pri_xxx_starter": {"plan": "starter", "max_bots": 1, "max_messages_per_month": 2000},
    # "pri_xxx_pro":     {"plan": "pro",     "max_bots": 5, "max_messages_per_month": 10000},
}


def verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Paddle Billing's documented scheme: header is 'ts=<unix>;h1=<hex>',
    and h1 = HMAC-SHA256(secret, f"{ts}:{raw_body}").hexdigest(). Rejects
    if the secret isn't configured (fail closed, not open) and rejects
    timestamps older than 5 minutes (replay protection).

    Self-tested below in billing_selftest.py by constructing a signature
    the same way and confirming this function accepts it and rejects a
    tampered body — that proves the verification LOGIC is correct, but
    cannot prove it matches Paddle's real header format until tested
    against a live webhook (Paddle's simulator, see module docstring).
    """
    if not PADDLE_WEBHOOK_SECRET or not signature_header:
        return False
    parts = dict(p.split("=", 1) for p in signature_header.split(";") if "=" in p)
    ts, h1 = parts.get("ts"), parts.get("h1")
    if not ts or not h1:
        return False
    if abs(time.time() - int(ts)) > 300:
        return False
    expected = hmac.new(
        PADDLE_WEBHOOK_SECRET.encode(), f"{ts}:{raw_body.decode()}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, h1)


def handle_event(event: dict) -> None:
    """Update `subscriptions` from a verified Paddle event. Expects
    event['data']['custom_data']['owner_user_id'] to be set — that means the
    checkout that created this subscription must have passed
    customData: {owner_user_id: <our user id>} to Paddle.js, so Paddle hands
    it back on every webhook for that subscription."""
    event_type = event.get("event_type", "")
    data = event.get("data", {})
    owner_user_id = (data.get("custom_data") or {}).get("owner_user_id")
    if not owner_user_id:
        return  # not one of our checkouts (or custom_data wasn't wired yet) — ignore

    if event_type == "subscription.created" or event_type == "subscription.updated":
        price_id = (data.get("items") or [{}])[0].get("price", {}).get("id")
        plan_info = PRICE_TO_PLAN.get(price_id, {})
        db.upsert_subscription_from_paddle(
            owner_user_id=owner_user_id,
            plan=plan_info.get("plan", "unknown"),
            status="active" if data.get("status") == "active" else data.get("status", "active"),
            max_bots=plan_info.get("max_bots"),
            max_messages_per_month=plan_info.get("max_messages_per_month"),
            current_period_end=data.get("current_billing_period", {}).get("ends_at"),
            paddle_subscription_id=data.get("id"),
            paddle_customer_id=data.get("customer_id"),
        )
    elif event_type == "subscription.canceled":
        db.upsert_subscription_from_paddle(
            owner_user_id=owner_user_id,
            status="canceled",
            paddle_subscription_id=data.get("id"),
        )
