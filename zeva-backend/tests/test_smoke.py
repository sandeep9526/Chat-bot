"""
Smoke tests for the critical flows the launch-readiness audit called out as
blockers: multi-tenant isolation, RAG answer quality/guardrails, lead
capture, and auth boundaries. These hit the real backend (in-process via
FastAPI's TestClient) against the real Neon database — no mocking of the
RLS-dependent behavior, since that's exactly what needs proving.

/chat tests call a real free LLM via OpenRouter, so they're slower and can
occasionally fail if every fallback model is briefly rate-limited — that's
a real, known characteristic of the free-model fallback chain (see
main.py's call_llm), not a flaky test.
"""

import os

import psycopg
import pytest

ADMIN_DB_URL = os.getenv("DATABASE_URL")


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_config_returns_public_fields_only(client, salon_bot):
    res = client.get(f"/config?botId={salon_bot}")
    assert res.status_code == 200
    body = res.json()
    assert body["botId"] == salon_bot
    assert "welcome" in body
    # Never leak anything server-only.
    assert "owner_user_id" not in body
    assert "suspended" not in body


@pytest.mark.slow
def test_isolation_dental_bot_does_not_know_salon_pricing(client, salon_bot, dental_bot):
    """The audit's core ask: bot A must never answer from bot B's documents."""
    res = client.post("/chat", json={"message": "How much is a haircut?", "botId": dental_bot})
    assert res.status_code == 200
    body = res.json()
    # Either a guardrail refusal, or — if it somehow answered — it must NOT
    # have invented the salon's real price (proves no cross-tenant leak).
    assert body["isGuardrail"] is True or "499" not in body["answer"]


@pytest.mark.slow
def test_isolation_salon_bot_does_not_know_dental_pricing(client, salon_bot, dental_bot):
    res = client.post("/chat", json={"message": "How much is a root canal?", "botId": salon_bot})
    assert res.status_code == 200
    body = res.json()
    assert body["isGuardrail"] is True or "3500" not in body["answer"]


@pytest.mark.slow
def test_in_scope_question_answered_with_citation(client, salon_bot):
    res = client.post("/chat", json={"message": "How much is a haircut?", "botId": salon_bot})
    assert res.status_code == 200
    body = res.json()
    assert body["isGuardrail"] is False
    assert "499" in body["answer"]
    assert len(body["sources"]) > 0
    assert body["sources"][0]["file"] == "info.txt"


@pytest.mark.slow
def test_out_of_scope_question_refuses_to_guess(client, salon_bot):
    res = client.post("/chat", json={"message": "What is the capital of France?", "botId": salon_bot})
    assert res.status_code == 200
    body = res.json()
    assert body["isGuardrail"] is True
    assert "Paris" not in body["answer"]


def test_chat_rejects_empty_message(client, salon_bot):
    res = client.post("/chat", json={"message": "   ", "botId": salon_bot})
    assert res.status_code == 400


def test_chat_rejects_oversized_message(client, salon_bot):
    res = client.post("/chat", json={"message": "x" * 5000, "botId": salon_bot})
    assert res.status_code == 400


def test_chat_unknown_bot_returns_404(client):
    res = client.post("/chat", json={"message": "hi", "botId": "does-not-exist-xyz"})
    assert res.status_code == 404


def test_lead_capture_saves_with_correct_bot_id(client, salon_bot):
    res = client.post(
        "/lead",
        json={"name": "Smoke Test Lead", "email": "smoketest@example.com", "botId": salon_bot},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    lead_id = body["leadId"]

    # Verify directly in the DB — /leads itself needs a real JWT, out of
    # scope for a backend-only smoke suite (see AUTH boundary tests below
    # for what's provable without one).
    with psycopg.connect(ADMIN_DB_URL) as conn, conn.cursor() as cur:
        cur.execute("SELECT bot_id, name, email FROM leads WHERE id = %s", (lead_id,))
        row = cur.fetchone()
        assert row is not None
        assert row[0] == salon_bot
        assert row[1] == "Smoke Test Lead"
        assert row[2] == "smoketest@example.com"
        cur.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
        conn.commit()


def test_lead_capture_rejects_missing_fields(client, salon_bot):
    res = client.post("/lead", json={"name": "", "email": "", "botId": salon_bot})
    assert res.status_code == 400


class TestAuthBoundaries:
    """No real JWT is forged here (Better Auth's signing key lives in the
    Next.js app, not this backend) — these only prove the ABSENCE of a
    token is correctly rejected everywhere it should be."""

    def test_admin_bots_requires_auth(self, client):
        assert client.get("/admin/bots").status_code == 401

    def test_leads_requires_auth(self, client, salon_bot):
        assert client.get(f"/leads?botId={salon_bot}").status_code == 401

    def test_admin_stats_requires_auth(self, client, salon_bot):
        assert client.get(f"/admin/stats?botId={salon_bot}").status_code == 401

    def test_ingest_requires_auth(self, client, salon_bot):
        res = client.post("/ingest", json={"botId": salon_bot, "filename": "x.txt", "text": "hi"})
        assert res.status_code == 401

    def test_subscription_requires_auth(self, client):
        assert client.get("/subscription").status_code == 401

    def test_superadmin_bots_requires_auth(self, client):
        assert client.get("/superadmin/bots").status_code == 401

    def test_superadmin_suspend_requires_auth(self, client, salon_bot):
        res = client.post("/superadmin/suspend-bot", json={"botId": salon_bot, "suspended": True})
        assert res.status_code == 401

    def test_lead_delete_requires_auth(self, client):
        assert client.delete("/leads/1").status_code == 401


def test_ingest_rejects_binary_content(client):
    """Regression test for the real bug found live: a .docx's raw zip bytes
    got silently ingested as a bot's entire knowledge base. This can't test
    the /ingest endpoint directly (needs auth), but exercises the same
    detection function main.py's /ingest calls."""
    from ingest import looks_like_binary

    assert looks_like_binary("PK\x03\x04garbagebinarydata") is True
    assert looks_like_binary("We are open 9am to 5pm every day.") is False
