"""
Cron worker: Automated Trial Expiry, Period-End Cancellation & Webhook Cleanup

Run periodically (e.g. once every hour or day via cron):
    python cron_trial_expiry.py

Actions:
1. Postgres advisory lock to prevent concurrent runs.
2. Warn users 3 days prior to trial expiration (logs to email_campaign_logs so sent only once).
3. Auto-transition expired trials to free tier in DB.
4. Auto-transition canceled paid subscriptions past current_period_end to free tier.
5. Notify affected users.
6. Prune webhook audit events older than 90 days.
"""

from __future__ import annotations

import logging
import os
import psycopg
from psycopg.rows import dict_row

import db
from notifications import send_trial_expiring_warning, send_trial_expired_notice

logger = logging.getLogger("ochreshift.cron")
CRON_ADVISORY_LOCK_ID = 42


def get_db_url() -> str:
    return os.getenv("APP_DATABASE_URL") or os.getenv("DATABASE_URL") or ""


def process_period_end_cancellations() -> None:
    """Transitions accounts with cancel_at_period_end=True whose billing period has expired."""
    try:
        canceled_rows = db.transition_period_end_cancellations()
        if canceled_rows:
            logger.info("[cron] Transitioned %d period-end cancellation(s) to free tier.", len(canceled_rows))
        else:
            logger.info("[cron] No period-end cancellations to transition.")
    except Exception as e:
        logger.error("[cron] Error transitioning period-end cancellations: %s", e)


def cleanup_old_webhook_events(days: int = 90) -> None:
    """Removes processed/ignored webhook events older than `days` to prevent table bloat."""
    db_url = get_db_url()
    if not db_url:
        return
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM webhook_events WHERE created_at < now() - (%s || ' days')::interval",
                    (str(days),),
                )
                deleted = cur.rowcount
                conn.commit()
                logger.info("[cron] Pruned %d webhook events older than %d days.", deleted, days)
    except Exception as e:
        logger.error("[cron] Error cleaning up old webhook events: %s", e)


def process_trial_expirations() -> None:
    """Run all scheduled tasks guarded by a Postgres advisory lock."""
    db_url = get_db_url()
    if not db_url:
        print("[cron_trial_expiry] No DATABASE_URL configured, skipping.")
        return

    try:
        conn = psycopg.connect(db_url)
    except Exception as e:
        print(f"[cron_trial_expiry] DB connection error: {e}")
        return

    locked = False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_try_advisory_lock(%s)", (CRON_ADVISORY_LOCK_ID,))
            locked = cur.fetchone()[0]

        if not locked:
            print("[cron_trial_expiry] Another cron instance is running. Exiting cleanly.")
            return

        # 1. Warn users whose trial expires in ~3 days
        try:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT u.id, u.email, u.name, s.trial_ends_at,
                           EXTRACT(DAY FROM (s.trial_ends_at - now()))::int AS days_left
                    FROM subscriptions s
                    JOIN "user" u ON s.owner_user_id = u.id
                    WHERE s.status = 'trialing'
                      AND s.trial_ends_at > now()
                      AND s.trial_ends_at <= now() + interval '3 days'
                      AND u.id NOT IN (
                          SELECT user_id FROM email_campaign_logs WHERE campaign_stage = 'trial_3day_warning'
                      )
                    """
                )
                warning_candidates = cur.fetchall()

                for candidate in warning_candidates:
                    email = candidate.get("email")
                    user_id = candidate.get("id")
                    days_left = max(1, candidate.get("days_left") or 3)
                    if email:
                        sent = send_trial_expiring_warning(email, days_left)
                        if sent:
                            cur.execute(
                                """
                                INSERT INTO email_campaign_logs (user_id, campaign_stage)
                                VALUES (%s, 'trial_3day_warning')
                                ON CONFLICT (user_id, campaign_stage) DO NOTHING
                                """,
                                (user_id,),
                            )
                            conn.commit()
                            print(f"[cron_trial_expiry] Sent 3-day warning to {email}")
        except Exception as e:
            print(f"[cron_trial_expiry] Error checking warning candidates: {e}")

        # 2. Transition expired trials
        expired_rows = db.transition_expired_trials()
        if not expired_rows:
            print("[cron_trial_expiry] No expired trials to transition.")
        else:
            print(f"[cron_trial_expiry] Transitioned {len(expired_rows)} expired trial(s) to free tier.")
            try:
                with conn.cursor(row_factory=dict_row) as cur:
                    for row in expired_rows:
                        user_id = row["owner_user_id"]
                        cur.execute('SELECT email FROM "user" WHERE id = %s', (user_id,))
                        u = cur.fetchone()
                        if u and u.get("email"):
                            email = u["email"]
                            cur.execute(
                                "SELECT 1 FROM email_campaign_logs WHERE user_id = %s AND campaign_stage = 'trial_expired'",
                                (user_id,),
                            )
                            if not cur.fetchone():
                                sent = send_trial_expired_notice(email)
                                if sent:
                                    cur.execute(
                                        """
                                        INSERT INTO email_campaign_logs (user_id, campaign_stage)
                                        VALUES (%s, 'trial_expired')
                                        ON CONFLICT (user_id, campaign_stage) DO NOTHING
                                        """,
                                        (user_id,),
                                    )
                                    conn.commit()
                                    print(f"[cron_trial_expiry] Sent trial expired notice to {email}")
            except Exception as e:
                print(f"[cron_trial_expiry] Error notifying expired users: {e}")

        # 3. Transition cancel_at_period_end subscriptions
        process_period_end_cancellations()

        # 4. Prune old webhook events
        cleanup_old_webhook_events(days=90)

    finally:
        if locked:
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT pg_advisory_unlock(%s)", (CRON_ADVISORY_LOCK_ID,))
                    conn.commit()
            except Exception:
                pass
        conn.close()


if __name__ == "__main__":
    process_trial_expirations()
