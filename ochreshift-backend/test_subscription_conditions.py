#!/usr/bin/env python3
"""
test_subscription_conditions.py — Comprehensive integration tests for ALL
subscription condition logic: plan limits, trial expiry, upgrades, downgrades,
bot gating (is_active), message quotas, and cancel-at-period-end.

Runs against the LIVE Neon Postgres database using a temporary test user to
validate real SQL behavior (RLS, is_active CASE, trial expiry transitions, etc.)

Usage:
    .venv/bin/pytest test_subscription_conditions.py -v
"""

from __future__ import annotations

import datetime
import os
import uuid

import pytest
from dotenv import load_dotenv

load_dotenv()

import db

# ─── Fixtures ──────────────────────────────────────────────────────────────

TEST_USER_ID = f"test-sub-{uuid.uuid4().hex[:8]}"
TEST_BOT_PREFIX = "test-sub-bot"


@pytest.fixture(autouse=True, scope="module")
def setup_and_teardown():
    """Create a temporary test user in the DB, clean up after all tests."""
    pool = db._get_pool()

    # Create a test user in the "user" table (Better Auth format)
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, true, now(), now())
            ON CONFLICT (id) DO NOTHING
            """,
            (TEST_USER_ID, "Test Subscription User", f"{TEST_USER_ID}@test.ochreshift.dev"),
        )
        conn.commit()

    yield

    # Cleanup: remove test bots, subscription, and user
    with pool.connection() as conn, conn.cursor() as cur:
        # Delete test bots (and their leads/chats/handoffs via CASCADE)
        cur.execute(
            "DELETE FROM bots WHERE owner_user_id = %s",
            (TEST_USER_ID,),
        )
        cur.execute(
            "DELETE FROM subscriptions WHERE owner_user_id = %s",
            (TEST_USER_ID,),
        )
        cur.execute(
            'DELETE FROM "user" WHERE id = %s',
            (TEST_USER_ID,),
        )
        conn.commit()


def _set_subscription(plan, status, max_bots, max_msgs, trial_ends=None, period_end=None,
                       cancel_at_period_end=False, gateway="manual"):
    """Helper: directly upsert a subscription row for testing."""
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        db._set_owner(cur, TEST_USER_ID)
        cur.execute(
            """
            INSERT INTO subscriptions (
                owner_user_id, plan, status, max_bots, max_messages_per_month,
                trial_ends_at, current_period_end, cancel_at_period_end, gateway, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (owner_user_id) DO UPDATE SET
                plan = EXCLUDED.plan,
                status = EXCLUDED.status,
                max_bots = EXCLUDED.max_bots,
                max_messages_per_month = EXCLUDED.max_messages_per_month,
                trial_ends_at = EXCLUDED.trial_ends_at,
                current_period_end = EXCLUDED.current_period_end,
                cancel_at_period_end = EXCLUDED.cancel_at_period_end,
                gateway = EXCLUDED.gateway,
                updated_at = now()
            """,
            (TEST_USER_ID, plan, status, max_bots, max_msgs,
             trial_ends, period_end, cancel_at_period_end, gateway),
        )
        conn.commit()


def _create_test_bot(suffix: str) -> str:
    """Helper: create a bot owned by the test user."""
    bot_id = f"{TEST_BOT_PREFIX}-{suffix}"
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        db._set_owner(cur, TEST_USER_ID)
        cur.execute(
            """
            INSERT INTO bots (bot_id, owner_user_id, name, created_at)
            VALUES (%s, %s, %s, now())
            ON CONFLICT (bot_id) DO NOTHING
            """,
            (bot_id, TEST_USER_ID, f"Test Bot {suffix}"),
        )
        conn.commit()
    return bot_id


def _delete_test_bots():
    """Helper: remove all test bots."""
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM bots WHERE owner_user_id = %s",
            (TEST_USER_ID,),
        )
        conn.commit()


def _get_bot_is_active(bot_id: str) -> bool:
    """Helper: query the is_active derived column for a specific bot."""
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        db._set_owner(cur, TEST_USER_ID)
        cur.execute(
            f"""
            SELECT {db._IS_ACTIVE_SQL}
            FROM bots b
            LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
            WHERE b.bot_id = %s
            """,
            (bot_id,),
        )
        row = cur.fetchone()
        return bool(row[0]) if row else False


# ─── Test: PLAN_LIMITS dict is complete ────────────────────────────────────

def test_plan_limits_cover_all_tiers():
    """Every plan tier that can appear in the DB has defined limits."""
    expected = {"free", "trial", "starter", "pro", "business", "enterprise"}
    assert set(db.PLAN_LIMITS.keys()) == expected


def test_plan_limits_ascending():
    """Higher plans should have >= bots and messages than lower plans."""
    order = ["free", "starter", "pro", "business", "enterprise"]
    for i in range(len(order) - 1):
        lower_bots, lower_msgs = db.PLAN_LIMITS[order[i]]
        upper_bots, upper_msgs = db.PLAN_LIMITS[order[i + 1]]
        assert upper_bots >= lower_bots, f"{order[i+1]} should have >= bots than {order[i]}"
        assert upper_msgs >= lower_msgs, f"{order[i+1]} should have >= messages than {order[i]}"


# ─── Test: Trial auto-provisioning ────────────────────────────────────────

def test_trial_auto_provisioned_on_first_access():
    """When a user has no subscription, get_subscription auto-creates a trial."""
    # Ensure no subscription exists
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM subscriptions WHERE owner_user_id = %s", (TEST_USER_ID,))
        conn.commit()

    sub = db.get_subscription(TEST_USER_ID)
    assert sub is not None
    assert sub["plan"] == "trial"
    assert sub["status"] == "trialing"
    assert sub["trial_ends_at"] is not None
    assert sub["max_bots"] == 5      # Trial = Pro-level limits
    assert sub["max_messages_per_month"] == 10_000


# ─── Test: Trial expiry → free downgrade ──────────────────────────────────

def test_trial_expired_downgrades_to_free():
    """An expired trial should auto-transition to the free plan."""
    expired = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    _set_subscription("trial", "trialing", 5, 10_000, trial_ends=expired)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["plan"] == "free"
    assert sub["status"] == "active"
    assert sub["max_bots"] == 1
    assert sub["max_messages_per_month"] == 50
    assert sub["trial_expired"] is True


def test_trial_active_stays_trialing():
    """A trial that hasn't expired should remain as trialing."""
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    _set_subscription("trial", "trialing", 5, 10_000, trial_ends=future)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["plan"] == "trial"
    assert sub["status"] == "trialing"
    assert sub["is_trialing"] is True
    assert sub["days_left_in_trial"] >= 6


# ─── Test: is_active SQL logic (bot gating) ───────────────────────────────

def test_active_subscription_makes_bot_active():
    """A bot with an active paid subscription should be is_active=True."""
    _delete_test_bots()
    bot_id = _create_test_bot("active")
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    _set_subscription("pro", "active", 5, 10_000, period_end=future)

    assert _get_bot_is_active(bot_id) is True


def test_expired_subscription_makes_bot_inactive():
    """A bot whose subscription period has ended should be is_active=False."""
    _delete_test_bots()
    bot_id = _create_test_bot("expired")
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    _set_subscription("pro", "active", 5, 10_000, period_end=past)

    assert _get_bot_is_active(bot_id) is False


def test_expired_trial_makes_bot_inactive():
    """A bot with an expired trial should be is_active=False."""
    _delete_test_bots()
    bot_id = _create_test_bot("trial-expired")
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    _set_subscription("trial", "trialing", 5, 10_000, trial_ends=past)

    assert _get_bot_is_active(bot_id) is False


def test_active_trial_makes_bot_active():
    """A bot with an active trial should be is_active=True."""
    _delete_test_bots()
    bot_id = _create_test_bot("trial-active")
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    _set_subscription("trial", "trialing", 5, 10_000, trial_ends=future)

    assert _get_bot_is_active(bot_id) is True


def test_free_plan_bot_is_active():
    """A bot on the free plan should always be is_active=True."""
    _delete_test_bots()
    bot_id = _create_test_bot("free")
    _set_subscription("free", "free", 1, 50)

    assert _get_bot_is_active(bot_id) is True


def test_canceled_status_makes_bot_inactive():
    """A canceled subscription (past period end) should make bot inactive."""
    _delete_test_bots()
    bot_id = _create_test_bot("canceled")
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    _set_subscription("pro", "canceled", 5, 10_000, period_end=past)

    assert _get_bot_is_active(bot_id) is False


def test_suspended_bot_always_inactive():
    """A platform-admin-suspended bot should be inactive regardless of plan."""
    _delete_test_bots()
    bot_id = _create_test_bot("suspended")
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    _set_subscription("pro", "active", 5, 10_000, period_end=future)

    # Suspend the bot
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE bots SET suspended = true WHERE bot_id = %s", (bot_id,))
        conn.commit()

    assert _get_bot_is_active(bot_id) is False


def test_paused_bot_always_inactive():
    """An owner-paused bot should be inactive regardless of plan."""
    _delete_test_bots()
    bot_id = _create_test_bot("paused")
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    _set_subscription("pro", "active", 5, 10_000, period_end=future)

    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("UPDATE bots SET paused = true WHERE bot_id = %s", (bot_id,))
        conn.commit()

    assert _get_bot_is_active(bot_id) is False


# ─── Test: Message quota enforcement ──────────────────────────────────────

def test_message_quota_under_limit():
    """check_usage_limit returns True when under the message cap."""
    _delete_test_bots()
    bot_id = _create_test_bot("quota-ok")
    _set_subscription("starter", "active", 1, 2_000)

    # No chats exist, so should be well under limit
    assert db.check_usage_limit(bot_id, TEST_USER_ID, 2_000) is True


def test_message_quota_at_limit():
    """check_usage_limit returns False when at/over the message cap."""
    _delete_test_bots()
    bot_id = _create_test_bot("quota-hit")
    _set_subscription("starter", "active", 1, 2_000)

    # Insert fake chats to hit the limit
    pool = db._get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        db._set_owner(cur, TEST_USER_ID)
        for i in range(5):
            cur.execute(
                """
                INSERT INTO chats (bot_id, question, answer, created_at)
                VALUES (%s, %s, %s, now())
                """,
                (bot_id, f"q{i}", f"a{i}"),
            )
        conn.commit()

    # Should still be under 2000
    assert db.check_usage_limit(bot_id, TEST_USER_ID, 2_000) is True

    # But if cap is set to 3, should fail
    assert db.check_usage_limit(bot_id, TEST_USER_ID, 3) is False


# ─── Test: Plan upgrade via set_owner_plan ────────────────────────────────

def test_upgrade_changes_plan_and_limits():
    """set_owner_plan should upgrade the plan and adjust limits."""
    _set_subscription("starter", "active", 1, 2_000, gateway="stripe")

    db.set_owner_plan(TEST_USER_ID, "pro", "active")

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["plan"] == "pro"
    assert sub["max_bots"] == 5
    assert sub["max_messages_per_month"] == 10_000



def test_downgrade_to_free():
    """downgrade_to_free should reset to free tier limits."""
    _set_subscription("pro", "active", 5, 10_000, gateway="stripe")

    db.downgrade_to_free(TEST_USER_ID)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["plan"] == "free"
    assert sub["max_bots"] == 1
    assert sub["max_messages_per_month"] == 50


# ─── Test: Cancel at period end ───────────────────────────────────────────

def test_cancel_at_period_end_flag():
    """Setting cancel_at_period_end should keep the sub active until period ends."""
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=15)
    _set_subscription("pro", "active", 5, 10_000, period_end=future, cancel_at_period_end=True)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["cancel_at_period_end"] is True
    assert sub["status"] == "active"  # Still active until period ends

    # Bot should still be active
    _delete_test_bots()
    bot_id = _create_test_bot("cancel-pending")
    assert _get_bot_is_active(bot_id) is True


# ─── Test: Usage percentage calculations ──────────────────────────────────

def test_usage_percentages_calculated():
    """get_subscription should return usage_percent_bots and usage_percent_messages."""
    _delete_test_bots()
    _create_test_bot("pct1")
    _create_test_bot("pct2")
    _set_subscription("pro", "active", 5, 10_000)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["bots_used"] == 2
    assert sub["usage_percent_bots"] == 40  # 2/5 = 40%
    assert "usage_percent_messages" in sub
    assert "messages_this_month" in sub


# ─── Test: Subscription enrichment fields ─────────────────────────────────

def test_subscription_enrichment_fields():
    """get_subscription should include is_trialing, trial_expired, days_left."""
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10)
    _set_subscription("trial", "trialing", 5, 10_000, trial_ends=future)

    sub = db.get_subscription(TEST_USER_ID)
    assert sub["is_trialing"] is True
    assert sub["trial_expired"] is False
    assert sub["days_left_in_trial"] >= 9
    assert sub["days_left_in_trial"] <= 10


# ─── Test: Bot with no owner (demo bots) always active ───────────────────

def test_ownerless_bot_always_active():
    """Bots with no owner (demo bots) should always be is_active=True."""
    pool = db._get_pool()
    bot_id = f"test-demo-{uuid.uuid4().hex[:6]}"

    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO bots (bot_id, owner_user_id, name) VALUES (%s, NULL, %s)",
            (bot_id, "Demo Bot"),
        )
        conn.commit()

    try:
        with pool.connection() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT {db._IS_ACTIVE_SQL}
                FROM bots b
                LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
                WHERE b.bot_id = %s
                """,
                (bot_id,),
            )
            row = cur.fetchone()
            assert row is not None
            assert bool(row[0]) is True
    finally:
        with pool.connection() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM bots WHERE bot_id = %s", (bot_id,))
            conn.commit()
