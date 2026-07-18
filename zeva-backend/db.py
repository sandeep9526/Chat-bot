"""
Postgres (Neon) data layer — bots, leads, chats, handoffs.

Connects as `zeva_app`, a least-privilege role with NOBYPASSRLS (see
create_app_role in the Phase 0.2 migration notes) — Row-Level Security
policies defined in schema.sql are what actually enforce multi-tenant
isolation here, not just the WHERE clauses in this file. Two access
patterns:

  - Owner-scoped (admin dashboard: list bots, leads, stats, handoffs) —
    sets `app.user_id` for the transaction; RLS only returns rows for bots
    that user owns.
  - Public/anonymous (widget: /config, /chat, /lead) — sets
    `app.public_bot_id` to the one bot_id being asked about; RLS allows
    reading/inserting against exactly that bot, nothing else.

`schema.sql` is applied once (via the admin/neondb_owner connection) when
setting up a new environment — this module assumes the schema already
exists and only opens a connection pool against it.
"""

import os

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

_pool: ConnectionPool | None = None


def _get_pool() -> ConnectionPool:
    # Read the env var lazily (not at module-import time): main.py imports
    # this module before calling load_dotenv(), so a module-level os.getenv()
    # here would always capture None.
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            os.getenv("APP_DATABASE_URL"),
            min_size=1,
            max_size=5,
            open=True,
            # Neon (and networks generally) can silently drop an idle
            # connection; without a liveness check the pool hands out a dead
            # one and the request 500s with "SSL connection has been closed
            # unexpectedly" — found live in production testing. This probes
            # each connection before handing it out and transparently
            # reconnects if it's dead, instead of surfacing the failure to
            # a real request.
            check=ConnectionPool.check_connection,
        )
    return _pool


def init_db() -> None:
    """Fail fast if the DB is unreachable. Schema/RLS are created by
    schema.sql (run once via the admin connection), not here."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1")


def _set_owner(cur, owner_user_id: str) -> None:
    """Scope this transaction to an authenticated owner (admin-path reads/writes)."""
    cur.execute("SELECT set_config('app.user_id', %s, true)", (owner_user_id,))


def _set_public_bot(cur, bot_id: str) -> None:
    """Scope this transaction to the one bot a public/anonymous caller asked about."""
    cur.execute("SELECT set_config('app.public_bot_id', %s, true)", (bot_id,))


def _set_platform_admin(cur) -> None:
    """Scope this transaction to cross-tenant read access. Callers MUST have
    already verified the caller's email against the platform-admin allow-list
    (main.py's is_platform_admin()) before calling this — this function
    trusts its caller completely, same trust model as _set_owner for a
    Paddle-verified webhook."""
    cur.execute("SELECT set_config('app.is_platform_admin', 'true', true)")


class BotLimitExceeded(Exception):
    """Raised when creating a NEW bot would exceed the owner's plan limit."""

    def __init__(self, max_bots: int):
        self.max_bots = max_bots
        super().__init__(f"plan allows at most {max_bots} bot(s)")


# Single source of truth for what each plan grants. Keep the plan names in sync
# with VALID_PLANS in main.py and PLAN_FEATURES in the dashboard UI. The Paddle
# webhook may still pass explicit overrides, but every plan *change* (trial
# auto-provision, an admin "set plan", or a future checkout) resolves its caps
# from here so the label and the enforced limits can never drift apart.
#   plan: (max_bots, max_messages_per_month)
PLAN_LIMITS: dict[str, tuple[int, int]] = {
    "trial": (1, 500),
    "starter": (1, 2_000),
    "pro": (5, 10_000),
    "business": (25, 50_000),
}


# A platform-admin-suspended bot is always inactive, regardless of plan. A
# bot with no owner (the pre-existing demo bots) is never license-gated —
# treat it as always active. Otherwise, an owned bot is active if its
# owner's subscription is a live trial or a paid period that hasn't lapsed.
_IS_ACTIVE_SQL = """
  CASE
    WHEN b.suspended THEN false
    WHEN b.owner_user_id IS NULL THEN true
    WHEN s.status = 'trialing' AND s.trial_ends_at > now() THEN true
    WHEN s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()) THEN true
    ELSE false
  END AS is_active
"""


# ---- reads / writes --------------------------------------------------------
def get_bot(bot_id: str) -> dict | None:
    """Public lookup — used by /config, /chat, /lead. Scoped to exactly this
    bot_id; RLS blocks reading any other bot through this path. Includes
    is_active (license/trial status) so callers can gate on it."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_public_bot(cur, bot_id)
        cur.execute(
            f"""
            SELECT b.*, s.plan, s.max_messages_per_month, {_IS_ACTIVE_SQL}
            FROM bots b LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
            WHERE b.bot_id = %s
            """,
            (bot_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_bot_for_owner(bot_id: str, owner_user_id: str) -> dict | None:
    """Admin-path lookup — returns None if the bot doesn't exist OR isn't
    owned by this user (RLS enforces the latter; same either way to the
    caller, so main.py can turn both into an honest 404)."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            f"""
            SELECT b.*, s.plan, s.max_messages_per_month, {_IS_ACTIVE_SQL}
            FROM bots b LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
            WHERE b.bot_id = %s
            """,
            (bot_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def _ensure_trial_subscription(cur, owner_user_id: str) -> int:
    """Idempotent: create a 14-day trial subscription for this owner if they
    don't have one yet (called from within upsert_bot's transaction — same
    cur, same app.user_id already set). Returns their current max_bots."""
    cur.execute("SELECT max_bots FROM subscriptions WHERE owner_user_id = %s", (owner_user_id,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        """
        INSERT INTO subscriptions (owner_user_id, plan, status, trial_ends_at)
        VALUES (%s, 'trial', 'trialing', now() + interval '14 days')
        RETURNING max_bots
        """,
        (owner_user_id,),
    )
    return cur.fetchone()[0]


def get_subscription(owner_user_id: str) -> dict | None:
    """The caller's own plan/status + actual usage — for the dashboard's
    billing view. botsUsed/messagesThisMonth are real counts, not just the
    plan's limits, so the UI can show e.g. '342 / 500 this month'."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("SELECT * FROM subscriptions WHERE owner_user_id = %s", (owner_user_id,))
        row = cur.fetchone()
        if not row:
            return None
        sub = dict(row)
        cur.execute("SELECT COUNT(*) AS n FROM bots WHERE owner_user_id = %s", (owner_user_id,))
        sub["bots_used"] = cur.fetchone()["n"]
        cur.execute(
            """
            SELECT COUNT(*) AS n FROM chats
            WHERE bot_id IN (SELECT bot_id FROM bots WHERE owner_user_id = %s)
              AND created_at >= date_trunc('month', now())
            """,
            (owner_user_id,),
        )
        sub["messages_this_month"] = cur.fetchone()["n"]
        return sub


def upsert_subscription_from_paddle(
    owner_user_id: str,
    plan: str | None = None,
    status: str | None = None,
    max_bots: int | None = None,
    max_messages_per_month: int | None = None,
    current_period_end: str | None = None,
    paddle_subscription_id: str | None = None,
    paddle_customer_id: str | None = None,
) -> None:
    """Trusted write path for the Paddle webhook handler ONLY — never call
    from a user-facing endpoint (see schema.sql's comment on subscriptions:
    writes only ever come from trial auto-provisioning or here). The caller
    (billing.py) must already have verified the Paddle webhook signature
    before this runs — that signature check is the real gate, this function
    trusts its caller completely. COALESCE means an unset field here leaves
    the existing value alone (a cancel event, e.g., only touches status)."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            """
            INSERT INTO subscriptions (
                owner_user_id, plan, status, max_bots, max_messages_per_month,
                current_period_end, paddle_subscription_id, paddle_customer_id
            )
            VALUES (%s, COALESCE(%s,'trial'), COALESCE(%s,'trialing'), COALESCE(%s,1),
                    COALESCE(%s,500), %s, %s, %s)
            ON CONFLICT (owner_user_id) DO UPDATE SET
              plan = COALESCE(excluded.plan, subscriptions.plan),
              status = COALESCE(excluded.status, subscriptions.status),
              max_bots = COALESCE(excluded.max_bots, subscriptions.max_bots),
              max_messages_per_month = COALESCE(excluded.max_messages_per_month, subscriptions.max_messages_per_month),
              current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
              paddle_subscription_id = COALESCE(excluded.paddle_subscription_id, subscriptions.paddle_subscription_id),
              paddle_customer_id = COALESCE(excluded.paddle_customer_id, subscriptions.paddle_customer_id),
              updated_at = now()
            """,
            (
                owner_user_id, plan, status, max_bots, max_messages_per_month,
                current_period_end, paddle_subscription_id, paddle_customer_id,
            ),
        )


def check_usage_limit(bot_id: str, owner_user_id: str, max_messages_per_month: int) -> bool:
    """True if this bot's owner is within their monthly /chat cap. Runs with
    app.user_id set to the BOT'S OWNER (not the anonymous /chat caller) —
    the app is checking cost-control state on the owner's behalf; the count
    itself is only used for an allow/deny decision, never returned to the
    (anonymous) caller, so this doesn't leak owner-scoped data to them."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            """
            SELECT COUNT(*) FROM chats
            WHERE bot_id IN (SELECT bot_id FROM bots WHERE owner_user_id = %s)
              AND created_at >= date_trunc('month', now())
            """,
            (owner_user_id,),
        )
        return cur.fetchone()[0] < max_messages_per_month


def list_bots_for_owner(owner_user_id: str) -> list[dict]:
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("SELECT bot_id, name, accent FROM bots ORDER BY bot_id")
        return [dict(r) for r in cur.fetchall()]


def upsert_bot(
    bot_id: str,
    owner_user_id: str,
    name: str,
    accent: str = "#4f46e5",
    welcome: str = "",
    suggestions: list[str] | None = None,
    allowed_domains: list[str] | None = None,
) -> None:
    """Create a bot (or update one you already own). RLS blocks re-registering
    someone else's bot_id (raises psycopg.errors.InsufficientPrivilege).
    Raises BotLimitExceeded if this is a genuinely NEW bot beyond the
    owner's plan limit (first bot ever auto-provisions a 14-day trial)."""
    import json

    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)

        cur.execute("SELECT 1 FROM bots WHERE bot_id = %s", (bot_id,))
        is_new_bot = cur.fetchone() is None
        if is_new_bot:
            max_bots = _ensure_trial_subscription(cur, owner_user_id)
            cur.execute("SELECT COUNT(*) FROM bots WHERE owner_user_id = %s", (owner_user_id,))
            if cur.fetchone()[0] >= max_bots:
                raise BotLimitExceeded(max_bots)

        cur.execute(
            """
            INSERT INTO bots (bot_id, owner_user_id, name, accent, welcome, suggestions, allowed_domains)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
            ON CONFLICT (bot_id) DO UPDATE SET
              name = excluded.name, accent = excluded.accent,
              welcome = excluded.welcome, suggestions = excluded.suggestions,
              allowed_domains = excluded.allowed_domains
            """,
            (
                bot_id, owner_user_id, name, accent, welcome,
                json.dumps(suggestions or []), json.dumps(allowed_domains or ["*"]),
            ),
        )


def save_lead(
    bot_id: str, name: str, email: str, phone: str | None, message: str | None,
    score: str = "cold",
) -> int:
    """Public — any website visitor submitting the widget's lead form.

    Uses lastval() instead of INSERT...RETURNING: RETURNING is subject to the
    table's SELECT policy (not just INSERT's WITH CHECK), and leads has no
    SELECT policy for anonymous callers by design — a visitor may create a
    lead but must not be able to read others back. lastval() reads the
    session's own just-used sequence value and isn't subject to table RLS.
    """
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_public_bot(cur, bot_id)
        cur.execute(
            "INSERT INTO leads (bot_id, name, email, phone, message, score) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (bot_id, name, email, phone, message, score),
        )
        cur.execute("SELECT lastval()")
        return cur.fetchone()[0]


def save_handoff(bot_id: str, name: str, contact: str, summary: str) -> int:
    """Public — triggered server-side on a hot/warm lead submission. See
    save_lead()'s docstring for why lastval() is used instead of RETURNING."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_public_bot(cur, bot_id)
        cur.execute(
            "INSERT INTO handoffs (bot_id, name, contact, summary) VALUES (%s,%s,%s,%s)",
            (bot_id, name, contact, summary),
        )
        cur.execute("SELECT lastval()")
        return cur.fetchone()[0]


def list_handoffs(bot_id: str, owner_user_id: str) -> list[dict]:
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            "SELECT * FROM handoffs WHERE bot_id = %s ORDER BY id DESC LIMIT 20", (bot_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def list_leads(bot_id: str, owner_user_id: str) -> list[dict]:
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("SELECT * FROM leads WHERE bot_id = %s ORDER BY id DESC", (bot_id,))
        return [dict(r) for r in cur.fetchall()]


def delete_lead(lead_id: int, owner_user_id: str) -> bool:
    """GDPR-style delete-on-request. Returns False if the lead doesn't exist
    OR isn't owned by this user (RLS enforces the latter — leads_delete_owner
    in schema.sql — so a mismatched owner silently deletes 0 rows rather than
    erroring, same pattern as get_bot_for_owner)."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
        return cur.rowcount > 0


def save_chat(bot_id: str, question: str, answer: str, is_guardrail: bool) -> None:
    """Public — every /chat turn, including guardrail refusals."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_public_bot(cur, bot_id)
        cur.execute(
            "INSERT INTO chats (bot_id, question, answer, is_guardrail) VALUES (%s, %s, %s, %s)",
            (bot_id, question, answer, is_guardrail),
        )


def stats(bot_id: str, owner_user_id: str) -> dict:
    """Dashboard numbers: leads, warm leads, chats, unanswered, top questions."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("SELECT COUNT(*) FROM leads WHERE bot_id = %s", (bot_id,))
        leads = cur.fetchone()[0]
        cur.execute(
            "SELECT COUNT(*) FROM leads WHERE bot_id = %s AND score IN ('hot','warm')", (bot_id,)
        )
        warm = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM chats WHERE bot_id = %s", (bot_id,))
        chats = cur.fetchone()[0]
        cur.execute(
            "SELECT COUNT(*) FROM chats WHERE bot_id = %s AND is_guardrail = true", (bot_id,)
        )
        unanswered = cur.fetchone()[0]
        cur.execute(
            "SELECT question, COUNT(*) n FROM chats WHERE bot_id = %s "
            "GROUP BY question ORDER BY n DESC LIMIT 6",
            (bot_id,),
        )
        top = cur.fetchall()
        return {
            "leads": leads,
            "warmLeads": warm,
            "chats": chats,
            "unanswered": unanswered,
            "topQuestions": [{"question": r[0], "count": r[1]} for r in top],
        }


# ---- Platform admin (superadmin panel) -------------------------------------
# Every function below reads across ALL tenants. Callers must already have
# verified the caller's email against the platform-admin allow-list — see
# _set_platform_admin()'s docstring.
def list_all_bots() -> list[dict]:
    """Every bot on the platform with its owner's email (NULL for the
    pre-existing unowned demo bots) and current plan/status."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_platform_admin(cur)
        cur.execute(
            f"""
            SELECT b.bot_id, b.name, b.accent, b.owner_user_id, u.email AS owner_email,
                   b.created_at, b.suspended, s.plan, s.status, {_IS_ACTIVE_SQL}
            FROM bots b
            LEFT JOIN "user" u ON u.id = b.owner_user_id
            LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
            ORDER BY b.created_at DESC
            """
        )
        return [dict(r) for r in cur.fetchall()]


def platform_stats() -> dict:
    """Totals across the whole platform, for the superadmin overview."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_platform_admin(cur)
        cur.execute("SELECT COUNT(*) FROM bots")
        total_bots = cur.fetchone()[0]
        cur.execute("SELECT COUNT(DISTINCT owner_user_id) FROM bots WHERE owner_user_id IS NOT NULL")
        total_owners = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM leads")
        total_leads = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM chats")
        total_chats = cur.fetchone()[0]
        cur.execute("SELECT plan, COUNT(*) FROM subscriptions GROUP BY plan")
        by_plan = {r[0]: r[1] for r in cur.fetchall()}
        return {
            "totalBots": total_bots,
            "totalOwners": total_owners,
            "totalLeads": total_leads,
            "totalChats": total_chats,
            "byPlan": by_plan,
        }


def set_bot_suspended(bot_id: str, suspended: bool) -> bool:
    """Platform-admin only — see bots_update_platform_admin in schema.sql.
    Deliberately touches ONLY the suspended column (never a generic
    "update any bot field" query) — RLS allows a wider UPDATE for this
    role, but the application layer is what keeps this action narrow.
    Returns False if bot_id doesn't exist."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_platform_admin(cur)
        cur.execute("UPDATE bots SET suspended = %s WHERE bot_id = %s", (suspended, bot_id))
        return cur.rowcount > 0


def set_owner_plan(owner_user_id: str, plan: str, status: str) -> None:
    """Platform-admin manual override — e.g. comping a client, or manually
    marking them active after an out-of-band payment. Reuses the exact same
    owner-scoped write path Paddle's webhook uses (upsert_subscription_from_paddle
    sets app.user_id = owner_user_id before writing, so RLS's
    subscriptions_update_owner policy is what actually allows this — the
    platform-admin check that gates *reaching* this function happens in
    main.py, same trust model as the webhook's signature check).

    Applies the plan's bot/message caps from PLAN_LIMITS so the limits always
    match the label — previously this only changed the plan *name*, leaving a
    freshly-upgraded 'pro' account still enforced at the trial's 1-bot cap."""
    max_bots, max_msgs = PLAN_LIMITS.get(plan, PLAN_LIMITS["trial"])
    upsert_subscription_from_paddle(
        owner_user_id,
        plan=plan,
        status=status,
        max_bots=max_bots,
        max_messages_per_month=max_msgs,
    )
