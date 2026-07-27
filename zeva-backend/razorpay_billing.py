"""
Razorpay billing integration (India) — creates Subscriptions for checkout
and a webhook receiver that keeps `subscriptions` in sync with real payment
events. This is the India-side counterpart to stripe_billing.py (global);
main.py routes a checkout request to one or the other based on the plan the
owner is paying for, chosen client-side (see BillingCard.tsx).

STATUS: structurally complete, NOT live-tested — there is no Razorpay
account for this project yet, so nothing here has been exercised against
Razorpay's real servers. Signature verification IS self-tested (see
billing_selftest.py) since that only requires the shared webhook secret, not
a live account. Before going live:
  1. Create a Razorpay account (business KYC required for live mode — test
     mode works without it) and, for each plan in PLAN_LIMITS, a Plan in
     Dashboard → Subscriptions → Plans (INR, monthly). Fill in their plan_id
     under PLAN_TO_RAZORPAY_PLAN_ID below.
  2. Dashboard → Account & Settings → Webhooks → add one pointed at
     POST {API_URL}/billing/razorpay-webhook, subscribed to at least:
     subscription.activated, subscription.charged, subscription.completed,
     subscription.cancelled, subscription.halted. Copy its secret into
     RAZORPAY_WEBHOOK_SECRET.
  3. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (Dashboard → API Keys) in .env.
  4. Use Razorpay's test mode + test cards/UPI to fire each event above and
     watch the `subscriptions` table update correctly — do not trust this
     file's event-shape assumptions until you've seen a real payload;
     Razorpay's docs are the source of truth at integration time.

Checkout itself is Razorpay's client-side Checkout.js opened against the
subscription_id returned by create_subscription() below — see
BillingCard.tsx, not something this backend module does.
"""

import datetime
import hashlib
import hmac
import os

try:
    import razorpay
except ImportError:
    razorpay = None

import db

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

# Our plan name -> Razorpay Plan id (created in the Razorpay dashboard, one
# per billing tier, INR/monthly). Fill these in once real plans exist.
PLAN_TO_RAZORPAY_PLAN_ID: dict[str, str] = {
    "starter": "plan_THfIQrwOGe2pNX",
    "pro": "plan_THfKz6LAULvcFX",
    "enterprise": "plan_THfMUsMzqGtz85",
}

_client: razorpay.Client | None = None


def _get_client() -> razorpay.Client:
    global _client
    if _client is None:
        if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
            raise RuntimeError("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured")
        _client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return _client


def create_subscription(plan: str, owner_user_id: str, owner_email: str | None = None) -> dict:
    """Creates a Razorpay Subscription for the caller to open Checkout
    against (Checkout.js, client-side — see BillingCard.tsx). total_count=120
    monthly cycles (10 years) is Razorpay's documented workaround for "no
    fixed end date" — subscriptions don't support billing forever, so this is
    effectively auto-renewing until canceled. `notes.owner_user_id`/`.plan`
    round-trip through every webhook event for this subscription, the same
    role Paddle's custom_data plays in billing.py."""
    plan_id = PLAN_TO_RAZORPAY_PLAN_ID.get(plan)
    if not plan_id:
        raise ValueError(f"no Razorpay plan configured for '{plan}'")
    sub = _get_client().subscription.create(
        {
            "plan_id": plan_id,
            "customer_notify": 1,
            "total_count": 120,
            "notes": {"owner_user_id": owner_user_id, "plan": plan},
        }
    )
    return {"subscriptionId": sub["id"], "keyId": RAZORPAY_KEY_ID}


def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Razorpay's documented scheme: the `X-Razorpay-Signature` header is
    hex(HMAC-SHA256(webhook_secret, raw_body)) — no timestamp component in
    this header (unlike Paddle's), so there's no replay window to check here;
    Razorpay's own recommendation is to rely on this signature plus normal
    idempotent handling of duplicate event ids. Fails closed if the secret
    isn't configured.

    Self-tested in billing_selftest.py by constructing a signature the same
    way and confirming this function accepts it and rejects a tampered body —
    that proves the verification LOGIC is correct, but cannot prove it
    matches Razorpay's real header format until tested against a live
    webhook (Razorpay's dashboard has a "test webhook" button for this)."""
    if not RAZORPAY_WEBHOOK_SECRET or not signature_header:
        return False
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _epoch_to_iso(ts: int | None) -> str | None:
    if not ts:
        return None
    return datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).isoformat()


def handle_event(event: dict) -> None:
    """Update `subscriptions` from a verified Razorpay event. Expects
    payload.subscription.entity.notes.owner_user_id to be set — that means
    the subscription must have been created via create_subscription() above,
    which always sets it."""
    event_type = event.get("event", "")
    entity = ((event.get("payload") or {}).get("subscription") or {}).get("entity") or {}
    notes = entity.get("notes") or {}
    owner_user_id = notes.get("owner_user_id")
    if not owner_user_id:
        return  # not one of our checkouts — ignore

    plan = notes.get("plan", "unknown")

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
        )
    elif event_type in ("subscription.cancelled", "subscription.completed"):
        db.upsert_subscription_from_razorpay(
            owner_user_id=owner_user_id,
            status="canceled",
            razorpay_subscription_id=entity.get("id"),
        )
    elif event_type == "subscription.halted":
        # Razorpay stops retrying charges and pauses the subscription —
        # closest equivalent to Paddle/Stripe's "past_due".
        db.upsert_subscription_from_razorpay(
            owner_user_id=owner_user_id,
            status="past_due",
            razorpay_subscription_id=entity.get("id"),
        )
