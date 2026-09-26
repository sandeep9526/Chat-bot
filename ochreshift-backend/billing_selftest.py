"""
Self-tests for the payment-gateway webhook signature verification schemes
(Paddle, Razorpay) and pricing tier / plan limits verification.
Stripe webhook logic and interval price ID resolutions are also exercised.

Run with: .venv/bin/pytest billing_selftest.py
"""

import hashlib
import hmac
import time

import billing
import db
import razorpay_billing
import stripe_billing


# ---- Plan Limits & Hybrid Model ---------------------------------------------
def test_plan_limits_contain_all_tiers():
    assert "free" in db.PLAN_LIMITS
    assert "trial" in db.PLAN_LIMITS
    assert "starter" in db.PLAN_LIMITS
    assert "pro" in db.PLAN_LIMITS
    assert "business" in db.PLAN_LIMITS
    assert "enterprise" in db.PLAN_LIMITS

    # Free tier: 1 bot, 50 msgs
    assert db.PLAN_LIMITS["free"] == (1, 50)
    # 14-day Pro trial overlay: 5 bots, 10,000 msgs
    assert db.PLAN_LIMITS["trial"] == (5, 10_000)
    # Starter: 1 bot, 2,000 msgs
    assert db.PLAN_LIMITS["starter"] == (1, 2_000)
    # Pro: 5 bots, 10,000 msgs
    assert db.PLAN_LIMITS["pro"] == (5, 10_000)
    # Business: 25 bots, 50,000 msgs
    assert db.PLAN_LIMITS["business"] == (25, 50_000)
    # Enterprise: 100 bots, 250,000 msgs
    assert db.PLAN_LIMITS["enterprise"] == (100, 250_000)


# ---- Stripe Price Resolution ------------------------------------------------
def test_stripe_price_resolution_defaults():
    assert stripe_billing.get_stripe_price_id("starter", "month") == "price_1Twz6jBDUfmAcUQEKs1x7iVC"
    assert stripe_billing.get_stripe_price_id("pro", "month") == "price_1Twz8XBDUfmAcUQE03jR6x6A"
    assert stripe_billing.get_stripe_price_id("enterprise", "month") == "price_1Twz95BDUfmAcUQEWnodECQF"
    # Annual
    assert stripe_billing.get_stripe_price_id("starter", "year") is not None
    assert stripe_billing.get_stripe_price_id("pro", "year") is not None


def test_stripe_price_resolution_env_override(monkeypatch):
    monkeypatch.setenv("STRIPE_PRICE_PRO_YEAR", "price_custom_pro_annual_123")
    assert stripe_billing.get_stripe_price_id("pro", "year") == "price_custom_pro_annual_123"


# ---- Razorpay Plan Resolution -----------------------------------------------
def test_razorpay_plan_resolution_defaults():
    assert razorpay_billing.get_razorpay_plan_id("starter", "month") == "plan_THfIQrwOGe2pNX"
    assert razorpay_billing.get_razorpay_plan_id("pro", "month") == "plan_THfKz6LAULvcFX"
    assert razorpay_billing.get_razorpay_plan_id("enterprise", "month") == "plan_THfMUsMzqGtz85"
    # Annual
    assert razorpay_billing.get_razorpay_plan_id("starter", "year") is not None
    assert razorpay_billing.get_razorpay_plan_id("pro", "year") is not None


def test_razorpay_plan_resolution_env_override(monkeypatch):
    monkeypatch.setenv("RAZORPAY_PLAN_BUSINESS_MONTH", "plan_custom_biz_456")
    assert razorpay_billing.get_razorpay_plan_id("business", "month") == "plan_custom_biz_456"


# ---- Paddle -----------------------------------------------------------------
def _paddle_signature(secret: str, ts: str, body: bytes) -> str:
    h1 = hmac.new(secret.encode(), f"{ts}:{body.decode()}".encode(), hashlib.sha256).hexdigest()
    return f"ts={ts};h1={h1}"


def test_paddle_accepts_a_correctly_signed_body(monkeypatch):
    monkeypatch.setattr(billing, "PADDLE_WEBHOOK_SECRET", "test_secret")
    body = b'{"event_type": "subscription.created"}'
    ts = str(int(time.time()))
    header = _paddle_signature("test_secret", ts, body)
    assert billing.verify_signature(body, header) is True


def test_paddle_rejects_a_tampered_body(monkeypatch):
    monkeypatch.setattr(billing, "PADDLE_WEBHOOK_SECRET", "test_secret")
    body = b'{"event_type": "subscription.created"}'
    ts = str(int(time.time()))
    header = _paddle_signature("test_secret", ts, body)
    tampered = b'{"event_type": "subscription.created", "data": {"status": "active"}}'
    assert billing.verify_signature(tampered, header) is False


def test_paddle_rejects_wrong_secret(monkeypatch):
    monkeypatch.setattr(billing, "PADDLE_WEBHOOK_SECRET", "test_secret")
    body = b'{"event_type": "subscription.created"}'
    ts = str(int(time.time()))
    header = _paddle_signature("wrong_secret", ts, body)
    assert billing.verify_signature(body, header) is False


def test_paddle_rejects_stale_timestamp(monkeypatch):
    monkeypatch.setattr(billing, "PADDLE_WEBHOOK_SECRET", "test_secret")
    body = b'{"event_type": "subscription.created"}'
    ts = str(int(time.time()) - 600)  # 10 minutes old, past the 5-minute window
    header = _paddle_signature("test_secret", ts, body)
    assert billing.verify_signature(body, header) is False


def test_paddle_fails_closed_with_no_secret_configured(monkeypatch):
    monkeypatch.setattr(billing, "PADDLE_WEBHOOK_SECRET", None)
    body = b'{"event_type": "subscription.created"}'
    ts = str(int(time.time()))
    header = _paddle_signature("test_secret", ts, body)
    assert billing.verify_signature(body, header) is False


# ---- Razorpay -----------------------------------------------------------------
def _razorpay_signature(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def test_razorpay_accepts_a_correctly_signed_body(monkeypatch):
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_WEBHOOK_SECRET", "test_secret")
    body = b'{"event": "subscription.activated"}'
    header = _razorpay_signature("test_secret", body)
    assert razorpay_billing.verify_webhook_signature(body, header) is True


def test_razorpay_rejects_a_tampered_body(monkeypatch):
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_WEBHOOK_SECRET", "test_secret")
    body = b'{"event": "subscription.activated"}'
    header = _razorpay_signature("test_secret", body)
    tampered = b'{"event": "subscription.cancelled"}'
    assert razorpay_billing.verify_webhook_signature(tampered, header) is False


def test_razorpay_rejects_wrong_secret(monkeypatch):
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_WEBHOOK_SECRET", "test_secret")
    body = b'{"event": "subscription.activated"}'
    header = _razorpay_signature("wrong_secret", body)
    assert razorpay_billing.verify_webhook_signature(body, header) is False


def test_razorpay_fails_closed_with_no_secret_configured(monkeypatch):
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_WEBHOOK_SECRET", None)
    body = b'{"event": "subscription.activated"}'
    header = _razorpay_signature("test_secret", body)
    assert razorpay_billing.verify_webhook_signature(body, header) is False


def test_razorpay_fails_closed_with_no_signature_header(monkeypatch):
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_WEBHOOK_SECRET", "test_secret")
    body = b'{"event": "subscription.activated"}'
    assert razorpay_billing.verify_webhook_signature(body, None) is False


# ---- Razorpay Client-Side Payment Signature Verification ---------------------
def test_razorpay_payment_signature_verification(monkeypatch):
    secret = "rzp_test_secret_123"
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_KEY_SECRET", secret)

    sub_id = "sub_test_001"
    payment_id = "pay_test_002"
    valid_sig = hmac.new(secret.encode(), f"{payment_id}|{sub_id}".encode(), hashlib.sha256).hexdigest()

    # Valid signature
    assert razorpay_billing.verify_payment_signature(sub_id, payment_id, valid_sig) is True

    # Tampered payment ID
    assert razorpay_billing.verify_payment_signature(sub_id, "pay_tampered", valid_sig) is False

    # Tampered subscription ID
    assert razorpay_billing.verify_payment_signature("sub_tampered", payment_id, valid_sig) is False

    # Wrong signature
    assert razorpay_billing.verify_payment_signature(sub_id, payment_id, "bad_signature") is False

    # Missing secret fails closed
    monkeypatch.setattr(razorpay_billing, "RAZORPAY_KEY_SECRET", None)
    assert razorpay_billing.verify_payment_signature(sub_id, payment_id, valid_sig) is False


# ---- Expired Trial SQL Logic -------------------------------------------------
def test_is_active_sql_treats_expired_trials_as_inactive():
    """Verify that _IS_ACTIVE_SQL explicitly evaluates s.trial_ends_at <= now() to false."""
    sql = db._IS_ACTIVE_SQL
    assert "WHEN s.status = 'trialing' AND s.trial_ends_at <= now() THEN false" in sql
    assert "WHEN s.status = 'trialing' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now()) THEN true" in sql


# ---- Price and Plan ID Validation -------------------------------------------
def test_stripe_price_validation_guards():
    assert stripe_billing.is_valid_price_id("price_1Twz6jBDUfmAcUQEKs1x7iVC") is True
    assert stripe_billing.is_valid_price_id(None) is False
    assert stripe_billing.is_valid_price_id("") is False
    # Mock / placeholder prices are rejected
    assert stripe_billing.is_valid_price_id("price_1Twz6jBDUfmAcUQEKs1x7iVC_annual") is False
    assert stripe_billing.is_valid_price_id("price_1TwzBusinessMonth") is False


def test_razorpay_plan_validation_guards():
    assert razorpay_billing.is_valid_plan_id("plan_THfIQrwOGe2pNX") is True
    assert razorpay_billing.is_valid_plan_id(None) is False
    assert razorpay_billing.is_valid_plan_id("") is False
    # Mock / placeholder plans are rejected
    assert razorpay_billing.is_valid_plan_id("plan_THfIQrwOGe2pNX_annual") is False
    assert razorpay_billing.is_valid_plan_id("plan_THfBusinessMonth") is False


# ---- Webhook Integration & Idempotency Tests (M12) ---------------------------
def test_stripe_webhook_handle_event_checkout_completed(monkeypatch):
    recorded_upsert = {}
    recorded_email = {}
    recorded_event = {}

    monkeypatch.setattr(db, "acquire_webhook_lock", lambda *args, **kwargs: True)
    monkeypatch.setattr(db, "validate_subscription_ownership", lambda *args, **kwargs: True)
    monkeypatch.setattr(
        db,
        "upsert_subscription_from_stripe",
        lambda **kwargs: recorded_upsert.update(kwargs),
    )
    monkeypatch.setattr(
        stripe_billing,
        "send_payment_receipt_email",
        lambda *args, **kwargs: recorded_email.update({"args": args, "kwargs": kwargs}),
    )
    monkeypatch.setattr(
        db,
        "record_webhook_event",
        lambda *args, **kwargs: recorded_event.update({"args": args, "kwargs": kwargs}),
    )

    event_payload = {
        "id": "evt_test_checkout_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": "usr_test_001",
                "customer": "cus_test_999",
                "subscription": "sub_test_888",
                "customer_details": {"email": "customer@example.com"},
                "amount_total": 4900,
                "currency": "usd",
                "metadata": {"plan": "pro", "interval": "month"},
            }
        },
    }

    stripe_billing.handle_event(event_payload)

    assert recorded_upsert["owner_user_id"] == "usr_test_001"
    assert recorded_upsert["plan"] == "pro"
    assert recorded_upsert["status"] == "active"
    assert recorded_upsert["stripe_subscription_id"] == "sub_test_888"
    assert recorded_upsert["stripe_customer_id"] == "cus_test_999"
    assert recorded_email["args"][0] == "customer@example.com"
    assert recorded_email["args"][2] == 49.0
    assert recorded_email["args"][3] == "USD"
    assert recorded_event["kwargs"]["status"] == "processed"


def test_stripe_webhook_idempotent_duplicate_rejection(monkeypatch):
    called = []
    monkeypatch.setattr(db, "acquire_webhook_lock", lambda *args, **kwargs: False)
    monkeypatch.setattr(
        db,
        "upsert_subscription_from_stripe",
        lambda **kwargs: called.append("upsert"),
    )

    event_payload = {
        "id": "evt_test_duplicate_123",
        "type": "checkout.session.completed",
        "data": {"object": {"client_reference_id": "usr_test_001"}},
    }

    stripe_billing.handle_event(event_payload)
    assert len(called) == 0  # Did not process duplicate


def test_stripe_webhook_ownership_mismatch_rejection(monkeypatch):
    recorded_event = {}
    monkeypatch.setattr(db, "acquire_webhook_lock", lambda *args, **kwargs: True)
    monkeypatch.setattr(db, "validate_subscription_ownership", lambda *args, **kwargs: False)
    monkeypatch.setattr(
        db,
        "record_webhook_event",
        lambda *args, **kwargs: recorded_event.update({"args": args, "kwargs": kwargs}),
    )

    event_payload = {
        "id": "evt_test_hijack_123",
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_attacker_sub",
                "metadata": {"owner_user_id": "usr_victim_123", "plan": "pro"},
            }
        },
    }

    stripe_billing.handle_event(event_payload)
    assert recorded_event["kwargs"]["status"] == "rejected_ownership"


def test_razorpay_webhook_handle_event_activated(monkeypatch):
    recorded_upsert = {}
    recorded_email = {}
    recorded_event = {}

    monkeypatch.setattr(db, "acquire_webhook_lock", lambda *args, **kwargs: True)
    monkeypatch.setattr(db, "validate_subscription_ownership", lambda *args, **kwargs: True)
    monkeypatch.setattr(db, "get_user_email", lambda user_id: "razorpay_user@example.com")
    monkeypatch.setattr(
        db,
        "upsert_subscription_from_razorpay",
        lambda **kwargs: recorded_upsert.update(kwargs),
    )
    monkeypatch.setattr(
        razorpay_billing,
        "send_payment_receipt_email",
        lambda *args, **kwargs: recorded_email.update({"args": args, "kwargs": kwargs}),
    )
    monkeypatch.setattr(
        db,
        "record_webhook_event",
        lambda *args, **kwargs: recorded_event.update({"args": args, "kwargs": kwargs}),
    )

    event_payload = {
        "id": "evt_rzp_activated_123",
        "event": "subscription.activated",
        "created_at": int(time.time()),
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_999",
                    "customer_id": "cust_rzp_888",
                    "current_end": int(time.time()) + 2592000,
                    "notes": {"owner_user_id": "usr_rzp_001", "plan": "starter", "interval": "month"},
                }
            },
            "payment": {
                "entity": {
                    "amount": 149900,  # 1499 INR in paise
                    "currency": "INR",
                }
            },
        },
    }

    razorpay_billing.handle_event(event_payload)

    assert recorded_upsert["owner_user_id"] == "usr_rzp_001"
    assert recorded_upsert["plan"] == "starter"
    assert recorded_upsert["razorpay_subscription_id"] == "sub_rzp_999"
    assert recorded_email["args"][0] == "razorpay_user@example.com"
    assert recorded_email["args"][2] == 1499.0  # Converted from paise
    assert recorded_email["kwargs"]["currency"] == "INR"
    assert recorded_event["kwargs"]["status"] == "processed"


def test_razorpay_webhook_replay_protection_rejection(monkeypatch):
    recorded_event = {}
    monkeypatch.setattr(
        db,
        "record_webhook_event",
        lambda *args, **kwargs: recorded_event.update({"args": args, "kwargs": kwargs}),
    )

    stale_event = {
        "id": "evt_rzp_stale_123",
        "event": "subscription.activated",
        "created_at": int(time.time()) - 1000,  # > 600s old
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_999",
                    "notes": {"owner_user_id": "usr_rzp_001", "plan": "starter"},
                }
            }
        },
    }

    razorpay_billing.handle_event(stale_event)
    assert recorded_event["kwargs"]["status"] == "ignored"
    assert "replay protection" in recorded_event["kwargs"]["error_message"].lower()


def test_paddle_webhook_handle_event_created(monkeypatch):
    recorded_upsert = {}
    monkeypatch.setattr(db, "acquire_webhook_lock", lambda *args, **kwargs: True)
    monkeypatch.setattr(db, "validate_subscription_ownership", lambda *args, **kwargs: True)
    monkeypatch.setattr(
        db,
        "upsert_subscription_from_paddle",
        lambda **kwargs: recorded_upsert.update(kwargs),
    )

    event_payload = {
        "event_id": "evt_pad_001",
        "event_type": "subscription.created",
        "data": {
            "id": "sub_pad_123",
            "customer_id": "ctm_pad_456",
            "status": "active",
            "custom_data": {"owner_user_id": "usr_pad_789"},
            "items": [{"price": {"id": "pri_unknown"}}],
        },
    }

    billing.handle_event(event_payload)
    assert recorded_upsert["owner_user_id"] == "usr_pad_789"
    assert recorded_upsert["paddle_subscription_id"] == "sub_pad_123"


