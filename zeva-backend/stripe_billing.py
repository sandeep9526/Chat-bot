"""
Stripe billing integration (global, non-India) — Checkout Sessions for
signup and a webhook receiver that keeps `subscriptions` in sync with real
payment events. This is the global counterpart to razorpay_billing.py
(India); main.py routes a checkout request to one or the other based on the
plan the owner is paying for, chosen client-side (see BillingCard.tsx).

STATUS: structurally complete, NOT live-tested — there is no Stripe account
for this project yet, so nothing here has been exercised against Stripe's
real servers. Webhook signature verification uses Stripe's own SDK
(stripe.Webhook.construct_event) rather than a hand-rolled HMAC check, since
that's Stripe-maintained and already covers the header format correctly —
unlike billing.py's Paddle scheme or razorpay_billing.py's, there's nothing
of ours to self-test here. Before going live:
  1. Create a Stripe account, a Product with one recurring Price per plan in
     PLAN_LIMITS (USD, monthly) — including "enterprise", or leave it out to
     keep enterprise as a "contact sales"-only tier (BillingCard.tsx falls
     back to that automatically when PLAN_TO_STRIPE_PRICE_ID has no entry).
     Fill in each price id under PLAN_TO_STRIPE_PRICE_ID below.
  2. Dashboard → Developers → Webhooks → add an endpoint at
     POST {API_URL}/billing/stripe-webhook, subscribed to at least:
     checkout.session.completed, customer.subscription.updated,
     customer.subscription.deleted. Copy its signing secret into
     STRIPE_WEBHOOK_SECRET.
  3. Set STRIPE_SECRET_KEY (Dashboard → Developers → API keys) in .env.
  4. Use `stripe trigger` or a real test-mode checkout to fire each event
     above and watch the `subscriptions` table update correctly — do not
     trust this file's event-shape assumptions until you've seen a real
     payload; Stripe's docs are the source of truth at integration time.
"""

import datetime
import os

try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
except ImportError:
    stripe = None
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Our plan name -> Stripe recurring Price id. Fill these in once real prices
# exist in the Stripe dashboard. A plan with no entry here (e.g. "enterprise"
# until a self-serve price is set up) simply can't self-serve checkout —
# create_checkout_session raises and the frontend falls back to "contact us".
PLAN_TO_STRIPE_PRICE_ID: dict[str, str] = {
    # "starter": "price_xxxxxxxxxxxxxx",
    # "pro": "price_xxxxxxxxxxxxxx",
    # "business": "price_xxxxxxxxxxxxxx",
    # "enterprise": "price_xxxxxxxxxxxxxx",
}


def create_checkout_session(
    plan: str,
    owner_user_id: str,
    owner_email: str | None,
    success_url: str,
    cancel_url: str,
) -> str:
    """Creates a Stripe Checkout Session (hosted page) and returns its URL —
    the caller redirects the browser there (see BillingCard.tsx). Both
    `client_reference_id` and `subscription_data.metadata` carry
    owner_user_id/plan so the webhook handler below can recover them from
    either the session itself (checkout.session.completed) or the
    subscription object directly (customer.subscription.updated/deleted,
    which don't include the originating session)."""
    price_id = PLAN_TO_STRIPE_PRICE_ID.get(plan)
    if not price_id:
        raise ValueError(f"no Stripe price configured for '{plan}'")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=owner_user_id,
        customer_email=owner_email,
        subscription_data={"metadata": {"owner_user_id": owner_user_id, "plan": plan}},
        metadata={"owner_user_id": owner_user_id, "plan": plan},
        allow_promotion_codes=True,
    )
    return session.url


def verify_and_parse_event(raw_body: bytes, signature_header: str | None) -> dict | None:
    """Verifies + decodes a Stripe webhook payload via Stripe's own SDK.
    Returns None (never raises) on any failure — missing secret, missing/bad
    signature header, or a tampered body — so main.py can turn that into a
    uniform 401 without needing to know Stripe's exception types."""
    if not STRIPE_WEBHOOK_SECRET or not signature_header:
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
    """Update `subscriptions` from a verified Stripe event."""
    event_type = event.get("type", "")
    data = (event.get("data") or {}).get("object") or {}

    if event_type == "checkout.session.completed":
        owner_user_id = data.get("client_reference_id") or (data.get("metadata") or {}).get(
            "owner_user_id"
        )
        plan = (data.get("metadata") or {}).get("plan", "unknown")
        if not owner_user_id:
            return
        max_bots, max_msgs = db.PLAN_LIMITS.get(plan, db.PLAN_LIMITS["trial"])
        db.upsert_subscription_from_stripe(
            owner_user_id=owner_user_id,
            plan=plan,
            status="active",
            max_bots=max_bots,
            max_messages_per_month=max_msgs,
            stripe_subscription_id=data.get("subscription"),
            stripe_customer_id=data.get("customer"),
        )
    elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
        owner_user_id = (data.get("metadata") or {}).get("owner_user_id")
        if not owner_user_id:
            return
        status = (
            "canceled"
            if event_type == "customer.subscription.deleted"
            else _STATUS_MAP.get(data.get("status"), "active")
        )
        db.upsert_subscription_from_stripe(
            owner_user_id=owner_user_id,
            status=status,
            current_period_end=_epoch_to_iso(data.get("current_period_end")),
            stripe_subscription_id=data.get("id"),
            stripe_customer_id=data.get("customer"),
        )
