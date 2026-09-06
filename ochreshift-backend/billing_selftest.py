"""
Self-tests for the payment-gateway webhook signature verification schemes
(Paddle, Razorpay) referenced by billing.py's and razorpay_billing.py's
module docstrings. Stripe isn't covered here — stripe_billing.py verifies
via Stripe's own SDK (stripe.Webhook.construct_event), so there's nothing of
ours to self-test.

These tests prove the verification LOGIC is correct (accepts a signature
built the documented way, rejects a tampered body, fails closed with no
secret configured) — they cannot prove it matches each gateway's real header
format until exercised against a live webhook (Paddle's simulator /
Razorpay's dashboard "test webhook" button). See each module's docstring for
the live-account setup steps still required before going live.

Run with: pytest billing_selftest.py
"""

import hashlib
import hmac
import time

import billing
import razorpay_billing


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
