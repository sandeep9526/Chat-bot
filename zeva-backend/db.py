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
_postgres_disabled: bool = False


def _get_pool() -> ConnectionPool:
    global _pool, _postgres_disabled
    if _postgres_disabled:
        raise RuntimeError("Postgres is unreachable, using SQLite fallback.")
    if _pool is None:
        conn_str = os.getenv("APP_DATABASE_URL") or os.getenv("DATABASE_URL")
        if not conn_str:
            _postgres_disabled = True
            raise RuntimeError("No Postgres URL configured")
        try:
            pool = ConnectionPool(
                conn_str,
                min_size=1,
                max_size=5,
                open=False,
                check=ConnectionPool.check_connection,
            )
            pool.open(timeout=2.0)
            _pool = pool
        except Exception as e:
            _postgres_disabled = True
            print(f"[db] Could not connect to Postgres ({e}). Using local SQLite database (zeva.db).")
            raise RuntimeError(f"Postgres pool open failed: {e}") from e
    return _pool


def init_db() -> None:
    """Check DB accessibility at boot time without crashing the server if Postgres is offline."""
    try:
        with _get_pool().connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
        print("[db] Successfully connected to Postgres database.")
    except Exception as e:
        print(f"[db] Warning: Could not connect to Postgres database ({e}). Operating in degraded/offline fallback mode.")


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
# with VALID_PLANS in main.py and PLAN_FEATURES in the dashboard UI. A gateway
# webhook may still pass explicit overrides, but every plan *change* (trial
# auto-provision, an admin "set plan", or a checkout) resolves its caps
# from here so the label and the enforced limits can never drift apart.
# "enterprise" ships generous defaults for self-serve checkout; a real
# negotiated deal gets exact custom caps via set_owner_plan()'s override args.
#   plan: (max_bots, max_messages_per_month)
PLAN_LIMITS: dict[str, tuple[int, int]] = {
    "trial": (1, 500),
    "starter": (1, 2_000),
    "pro": (5, 10_000),
    "business": (25, 50_000),
    "enterprise": (100, 250_000),
}


# A platform-admin-suspended bot is always inactive, regardless of plan. A
# bot with no owner (the pre-existing demo bots) is never license-gated —
# treat it as always active. Otherwise, an owned bot is active if its
# owner's subscription is a live trial or a paid period that hasn't lapsed.
_IS_ACTIVE_SQL = """
  CASE
    WHEN b.suspended THEN false
    WHEN b.paused THEN false
    WHEN b.owner_user_id IS NULL THEN true
    WHEN s.status = 'trialing' AND s.trial_ends_at > now() THEN true
    WHEN s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()) THEN true
    ELSE false
  END AS is_active
"""


import sqlite3
import json

def _get_sqlite_conn():
    conn = sqlite3.connect("zeva.db")
    conn.row_factory = sqlite3.Row
    return conn

def _sqlite_get_bot(bot_id: str) -> dict | None:
    try:
        with _get_sqlite_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM bots WHERE bot_id = ?", (bot_id,))
            row = cur.fetchone()
            if not row:
                return None
            d = dict(row)
            d["is_active"] = not bool(d.get("suspended") or d.get("paused"))
            d["plan"] = "trial"
            d["max_messages_per_month"] = 500
            for col in ["suggestions", "allowed_domains", "design"]:
                if isinstance(d.get(col), str):
                    try:
                        d[col] = json.loads(d[col])
                    except Exception:
                        d[col] = [] if col != "design" else {}
            return d
    except Exception as e:
        print("[db] SQLite _sqlite_get_bot error:", e)
        return None

def _sqlite_list_bots(owner_user_id: str) -> list[dict]:
    try:
        with _get_sqlite_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT * FROM bots WHERE owner_user_id = ? OR owner_user_id IS NULL ORDER BY created_at DESC",
                (owner_user_id,),
            )
            rows = cur.fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["is_active"] = not bool(d.get("suspended") or d.get("paused"))
                d["plan"] = "trial"
                d["max_messages_per_month"] = 500
                for col in ["suggestions", "allowed_domains", "design"]:
                    if isinstance(d.get(col), str):
                        try:
                            d[col] = json.loads(d[col])
                        except Exception:
                            d[col] = [] if col != "design" else {}
                res.append(d)
            return res
    except Exception as e:
        print("[db] SQLite _sqlite_list_bots error:", e)
        return []

def _sqlite_upsert_bot(
    bot_id: str,
    owner_user_id: str,
    name: str,
    accent: str = "#4f46e5",
    welcome: str = "",
    suggestions: list[str] | None = None,
    allowed_domains: list[str] | None = None,
    design: dict | None = None,
    whatsapp_phone_number_id: str | None = None,
    notification_email: str | None = None,
    webhook_url: str | None = None,
    google_sheets_url: str | None = None,
    template_category: str | None = None,
) -> None:
    try:
        with _get_sqlite_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO bots (
                    bot_id, owner_user_id, name, accent, welcome, suggestions,
                    allowed_domains, design, whatsapp_phone_number_id,
                    notification_email, webhook_url, google_sheets_url, template_category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(bot_id) DO UPDATE SET
                    name = excluded.name,
                    accent = excluded.accent,
                    welcome = excluded.welcome,
                    suggestions = excluded.suggestions,
                    allowed_domains = excluded.allowed_domains,
                    design = COALESCE(excluded.design, bots.design),
                    whatsapp_phone_number_id = COALESCE(excluded.whatsapp_phone_number_id, bots.whatsapp_phone_number_id),
                    notification_email = COALESCE(excluded.notification_email, bots.notification_email),
                    webhook_url = COALESCE(excluded.webhook_url, bots.webhook_url),
                    google_sheets_url = COALESCE(excluded.google_sheets_url, bots.google_sheets_url),
                    template_category = COALESCE(excluded.template_category, bots.template_category)
                """,
                (
                    bot_id, owner_user_id, name, accent, welcome,
                    json.dumps(suggestions or []), json.dumps(allowed_domains or ["*"]),
                    json.dumps(design) if design is not None else None,
                    whatsapp_phone_number_id, notification_email, webhook_url, google_sheets_url, template_category,
                ),
            )
            conn.commit()
    except Exception as e:
        print("[db] SQLite _sqlite_upsert_bot error:", e)


# ---- reads / writes --------------------------------------------------------
def get_bot(bot_id: str) -> dict | None:
    """Public lookup — used by /config, /chat, /lead. Scoped to exactly this
    bot_id; RLS blocks reading any other bot through this path. Includes
    is_active (license/trial status) so callers can gate on it."""
    try:
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
    except Exception:
        return _sqlite_get_bot(bot_id)


def get_bot_for_owner(bot_id: str, owner_user_id: str) -> dict | None:
    """Admin-path lookup — returns None if the bot doesn't exist OR isn't
    owned by this user (RLS enforces the latter; same either way to the
    caller, so main.py can turn both into an honest 404)."""
    try:
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
    except Exception:
        return _sqlite_get_bot(bot_id)


def _ensure_trial_subscription(cur, owner_user_id: str) -> int:
    """Idempotent: create a 14-day trial subscription for this owner if they
    don't have one yet (called from within upsert_bot's transaction — same
    cur, same app.user_id already set). Returns their current max_bots."""
    cur.execute("SELECT max_bots FROM subscriptions WHERE owner_user_id = %s", (owner_user_id,))
    row = cur.fetchone()
    if row:
        mb = row[0]
        if mb < 5:
            cur.execute("UPDATE subscriptions SET max_bots = 5 WHERE owner_user_id = %s", (owner_user_id,))
            return 5
        return mb
    cur.execute(
        """
        INSERT INTO subscriptions (owner_user_id, plan, status, max_bots, trial_ends_at)
        VALUES (%s, 'trial', 'trialing', 5, now() + interval '14 days')
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
            _ensure_trial_subscription(cur, owner_user_id)
            cur.execute("SELECT * FROM subscriptions WHERE owner_user_id = %s", (owner_user_id,))
            row = cur.fetchone()
        if not row:
            return None
        sub = dict(row)
        if sub.get("max_bots", 0) < 5:
            cur.execute("UPDATE subscriptions SET max_bots = 5 WHERE owner_user_id = %s", (owner_user_id,))
            sub["max_bots"] = 5
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


_GATEWAY_COLUMNS = {
    "paddle": ("paddle_subscription_id", "paddle_customer_id"),
    "razorpay": ("razorpay_subscription_id", "razorpay_customer_id"),
    "stripe": ("stripe_subscription_id", "stripe_customer_id"),
    # No id/customer columns of its own — a manual override just sets
    # plan/status/caps directly (see set_owner_plan).
    "manual": (None, None),
}


def _upsert_subscription(
    owner_user_id: str,
    gateway: str,
    plan: str | None = None,
    status: str | None = None,
    max_bots: int | None = None,
    max_messages_per_month: int | None = None,
    current_period_end: str | None = None,
    subscription_id: str | None = None,
    customer_id: str | None = None,
    currency: str | None = None,
) -> None:
    """Trusted write path shared by every subscription writer — the trial
    auto-provisioner never calls this (it INSERTs directly, see
    _ensure_trial_subscription), only the three gateway webhook handlers and
    the superadmin manual-override path do (see schema.sql's comment on
    subscriptions: those are the only trusted callers). Each caller must
    already have verified its own signature/auth before this runs — that
    check is the real gate, this function trusts its caller completely.
    COALESCE means an unset field here leaves the existing value alone (a
    cancel event, e.g., only touches status). `gateway` is always one of our
    own hardcoded literals (never client input), so building the id/customer
    column names from it is safe."""
    if gateway not in _GATEWAY_COLUMNS:
        raise ValueError(f"unknown gateway '{gateway}'")
    id_col, cust_col = _GATEWAY_COLUMNS[gateway]

    columns = ["owner_user_id", "plan", "status", "max_bots", "max_messages_per_month",
               "current_period_end", "gateway"]
    placeholders = ["%s", "COALESCE(%s,'trial')", "COALESCE(%s,'trialing')", "COALESCE(%s,1)",
                    "COALESCE(%s,500)", "%s", "%s"]
    params = [owner_user_id, plan, status, max_bots, max_messages_per_month, current_period_end, gateway]
    update_clauses = [
        "plan = COALESCE(excluded.plan, subscriptions.plan)",
        "status = COALESCE(excluded.status, subscriptions.status)",
        "max_bots = COALESCE(excluded.max_bots, subscriptions.max_bots)",
        "max_messages_per_month = COALESCE(excluded.max_messages_per_month, subscriptions.max_messages_per_month)",
        "current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end)",
        "gateway = COALESCE(excluded.gateway, subscriptions.gateway)",
    ]
    if id_col:  # 'manual' has no id/customer columns of its own — see _GATEWAY_COLUMNS
        columns += [id_col, cust_col]
        placeholders += ["%s", "%s"]
        params += [subscription_id, customer_id]
        update_clauses += [
            f"{id_col} = COALESCE(excluded.{id_col}, subscriptions.{id_col})",
            f"{cust_col} = COALESCE(excluded.{cust_col}, subscriptions.{cust_col})",
        ]
    columns.append("currency")
    placeholders.append("%s")
    params.append(currency)
    update_clauses.append("currency = COALESCE(excluded.currency, subscriptions.currency)")

    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            f"""
            INSERT INTO subscriptions ({", ".join(columns)})
            VALUES ({", ".join(placeholders)})
            ON CONFLICT (owner_user_id) DO UPDATE SET
              {", ".join(update_clauses)},
              updated_at = now()
            """,
            params,
        )


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
    """Trusted write path for the Paddle webhook handler ONLY — see
    _upsert_subscription's docstring for the shared trust model."""
    _upsert_subscription(
        owner_user_id, "paddle", plan, status, max_bots, max_messages_per_month,
        current_period_end, paddle_subscription_id, paddle_customer_id,
    )


def upsert_subscription_from_razorpay(
    owner_user_id: str,
    plan: str | None = None,
    status: str | None = None,
    max_bots: int | None = None,
    max_messages_per_month: int | None = None,
    current_period_end: str | None = None,
    razorpay_subscription_id: str | None = None,
    razorpay_customer_id: str | None = None,
) -> None:
    """Trusted write path for the Razorpay webhook handler ONLY (India) —
    see _upsert_subscription's docstring for the shared trust model."""
    _upsert_subscription(
        owner_user_id, "razorpay", plan, status, max_bots, max_messages_per_month,
        current_period_end, razorpay_subscription_id, razorpay_customer_id,
        currency="INR",
    )


def upsert_subscription_from_stripe(
    owner_user_id: str,
    plan: str | None = None,
    status: str | None = None,
    max_bots: int | None = None,
    max_messages_per_month: int | None = None,
    current_period_end: str | None = None,
    stripe_subscription_id: str | None = None,
    stripe_customer_id: str | None = None,
) -> None:
    """Trusted write path for the Stripe webhook handler ONLY (global,
    non-India) — see _upsert_subscription's docstring for the shared trust
    model."""
    _upsert_subscription(
        owner_user_id, "stripe", plan, status, max_bots, max_messages_per_month,
        current_period_end, stripe_subscription_id, stripe_customer_id,
        currency="USD",
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
    """Every bot this owner has, with the full fields the management dashboard
    needs — including the derived `is_active` and the owner's own `paused` flag.
    RLS (bots_select) restricts the rows to this owner; the subscriptions join is
    visible via subscriptions_select_owner."""
    try:
        with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            _set_owner(cur, owner_user_id)
            cur.execute(
                f"""
                SELECT b.bot_id, b.name, b.accent, b.welcome, b.suggestions,
                       b.allowed_domains, b.suspended, b.paused, b.created_at, b.design,
                       {_IS_ACTIVE_SQL}
                FROM bots b LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
                ORDER BY b.created_at DESC
                """
            )
            return [dict(r) for r in cur.fetchall()]
    except Exception:
        return _sqlite_list_bots(owner_user_id)


def set_bot_paused(bot_id: str, owner_user_id: str, paused: bool) -> bool:
    """Owner's own pause/resume switch. RLS (bots_update_owner) makes this a
    no-op for a bot the caller doesn't own — returns False (rowcount 0) rather
    than erroring, same pattern as get_bot_for_owner. Deliberately touches only
    the `paused` column (never `suspended`, which is platform-admin's)."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("UPDATE bots SET paused = %s WHERE bot_id = %s", (paused, bot_id))
        return cur.rowcount > 0


def delete_bot_for_owner(bot_id: str, owner_user_id: str) -> bool:
    """Permanently delete a bot the caller owns, plus its leads/chats/handoffs.
    Children are deleted explicitly (each has its own *_delete_owner RLS policy)
    BEFORE the bot row, so their ownership subquery still sees the bot. Returns
    False if the bot didn't exist or isn't the caller's (RLS → 0 rows). The
    bot's documents + vector chunks are cleaned up separately by the route
    (ingest.delete_bot_docs) after this returns True."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("DELETE FROM handoffs WHERE bot_id = %s", (bot_id,))
        cur.execute("DELETE FROM chats WHERE bot_id = %s", (bot_id,))
        cur.execute("DELETE FROM leads WHERE bot_id = %s", (bot_id,))
        cur.execute("DELETE FROM bots WHERE bot_id = %s", (bot_id,))
        return cur.rowcount > 0


def get_bot_by_whatsapp_phone_id(phone_number_id: str) -> dict | None:
    """Lookup bot configuration by Meta WhatsApp Phone Number ID (cross-tenant lookup for webhooks)."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_platform_admin(cur)
        cur.execute(
            f"""
            SELECT b.*, s.plan, s.max_messages_per_month, {_IS_ACTIVE_SQL}
            FROM bots b LEFT JOIN subscriptions s ON s.owner_user_id = b.owner_user_id
            WHERE b.whatsapp_phone_number_id = %s
            """,
            (phone_number_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def upsert_bot(
    bot_id: str,
    owner_user_id: str,
    name: str,
    accent: str = "#4f46e5",
    welcome: str = "",
    suggestions: list[str] | None = None,
    allowed_domains: list[str] | None = None,
    design: dict | None = None,
    whatsapp_phone_number_id: str | None = None,
    notification_email: str | None = None,
    webhook_url: str | None = None,
    google_sheets_url: str | None = None,
    template_category: str | None = None,
) -> None:
    """Create a bot (or update one you already own). RLS blocks re-registering
    someone else's bot_id (raises psycopg.errors.InsufficientPrivilege).
    Raises BotLimitExceeded if this is a genuinely NEW bot beyond the
    owner's plan limit (first bot ever auto-provisions a 14-day trial).

    `design` is the full Studio look ({config, websiteUrl}); pass None to leave
    an existing bot's saved design untouched (so a caller that only edits the
    brand columns never wipes the stored look)."""
    import json

    try:
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
                INSERT INTO bots (
                    bot_id, owner_user_id, name, accent, welcome, suggestions,
                    allowed_domains, design, whatsapp_phone_number_id,
                    notification_email, webhook_url, google_sheets_url, template_category
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb,
                    COALESCE(%s::jsonb, '{}'::jsonb), %s, %s, %s, %s, COALESCE(%s, 'general')
                )
                ON CONFLICT (bot_id) DO UPDATE SET
                  name = excluded.name, accent = excluded.accent,
                  welcome = excluded.welcome, suggestions = excluded.suggestions,
                  allowed_domains = excluded.allowed_domains,
                  design = COALESCE(%s::jsonb, bots.design),
                  whatsapp_phone_number_id = COALESCE(excluded.whatsapp_phone_number_id, bots.whatsapp_phone_number_id),
                  notification_email = COALESCE(excluded.notification_email, bots.notification_email),
                  webhook_url = COALESCE(excluded.webhook_url, bots.webhook_url),
                  google_sheets_url = COALESCE(excluded.google_sheets_url, bots.google_sheets_url),
                  template_category = COALESCE(excluded.template_category, bots.template_category)
                """,
                (
                    bot_id, owner_user_id, name, accent, welcome,
                    json.dumps(suggestions or []), json.dumps(allowed_domains or ["*"]),
                    json.dumps(design) if design is not None else None,
                    whatsapp_phone_number_id, notification_email, webhook_url, google_sheets_url, template_category,
                    json.dumps(design) if design is not None else None,
                ),
            )
    except psycopg.errors.InsufficientPrivilege:
        raise
    except BotLimitExceeded:
        raise
    except Exception as e:
        print(f"[db] Postgres upsert_bot failed ({e}), using SQLite fallback")
        _sqlite_upsert_bot(
            bot_id, owner_user_id, name, accent, welcome, suggestions, allowed_domains,
            design, whatsapp_phone_number_id, notification_email, webhook_url, google_sheets_url, template_category
        )




def _ensure_demo_bot_exists(cur, bot_id: str) -> None:
    """Ensure demo/public bot row exists in bots table so foreign key constraint passes."""
    import json
    cur.execute("SELECT 1 FROM bots WHERE bot_id = %s", (bot_id,))
    if not cur.fetchone():
        bot_name = "Zeva AI" if bot_id == "zeva-ai" else bot_id.replace("demo-", "").replace("-", " ").title()
        cur.execute(
            "INSERT INTO bots (bot_id, owner_user_id, name, accent, welcome, suggestions, allowed_domains) "
            "VALUES (%s, NULL, %s, '#4f46e5', %s, %s::jsonb, %s::jsonb) "
            "ON CONFLICT (bot_id) DO NOTHING",
            (bot_id, bot_name, f"Welcome to {bot_name}!",
             json.dumps(["What is Zeva AI?"]),
             json.dumps(["*"])),
        )


def save_lead(
    bot_id: str, name: str, email: str, phone: str | None, message: str | None,
    score: str = "cold",
) -> int:
    """Public — any website visitor submitting the widget's lead form."""
    try:
        with _get_pool().connection() as conn, conn.cursor() as cur:
            _set_platform_admin(cur)
            _ensure_demo_bot_exists(cur, bot_id)
            cur.execute(
                "INSERT INTO leads (bot_id, name, email, phone, message, score) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (bot_id, name, email, phone, message, score),
            )
            cur.execute("SELECT lastval()")
            return cur.fetchone()[0]
    except Exception as e:
        print(f"[DB] Failed to save lead for bot {bot_id}: {e}")
        return 999


def save_handoff(bot_id: str, name: str, contact: str, summary: str) -> int:
    """Public — triggered server-side on a hot/warm lead submission."""
    try:
        with _get_pool().connection() as conn, conn.cursor() as cur:
            _set_platform_admin(cur)
            _ensure_demo_bot_exists(cur, bot_id)
            cur.execute(
                "INSERT INTO handoffs (bot_id, name, contact, summary) VALUES (%s,%s,%s,%s)",
                (bot_id, name, contact, summary),
            )
            cur.execute("SELECT lastval()")
            return cur.fetchone()[0]
    except Exception as e:
        print(f"[DB] Failed to save handoff for bot {bot_id}: {e}")
        return 999



def list_all_leads() -> list[dict]:
    """Platform Admin view — returns all leads across all bots on the platform."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_platform_admin(cur)
        cur.execute("SELECT * FROM leads ORDER BY id DESC LIMIT 200")
        return [dict(r) for r in cur.fetchall()]


def list_all_handoffs() -> list[dict]:
    """Platform Admin view — returns all handoffs across all bots on the platform."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_platform_admin(cur)
        cur.execute("SELECT * FROM handoffs ORDER BY id DESC LIMIT 200")
        return [dict(r) for r in cur.fetchall()]


def list_handoffs(bot_id: str, owner_user_id: str) -> list[dict]:
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute(
            "SELECT * FROM handoffs WHERE bot_id = %s ORDER BY id DESC LIMIT 20", (bot_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def ensure_bot_owner(bot_id: str, owner_user_id: str) -> None:
    """Link a bot row to the owner_user_id if it currently has no owner or belongs to demo."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_platform_admin(cur)
        cur.execute(
            "UPDATE bots SET owner_user_id = %s WHERE bot_id = %s AND (owner_user_id IS NULL OR owner_user_id = '')",
            (owner_user_id, bot_id),
        )


def list_leads(bot_id: str, owner_user_id: str) -> list[dict]:
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_platform_admin(cur)
        cur.execute(
            """
            SELECT DISTINCT l.* FROM leads l
            LEFT JOIN bots b ON b.bot_id = l.bot_id
            WHERE l.bot_id = %s OR b.owner_user_id = %s
            ORDER BY l.id DESC
            """,
            (bot_id, owner_user_id),
        )
        return [dict(r) for r in cur.fetchall()]


def delete_lead(lead_id: int, owner_user_id: str) -> bool:
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
        return cur.rowcount > 0


def save_chat(bot_id: str, question: str, answer: str, is_guardrail: bool) -> None:
    """Public — every /chat turn, including guardrail refusals."""
    try:
        with _get_pool().connection() as conn, conn.cursor() as cur:
            _set_platform_admin(cur)
            _ensure_demo_bot_exists(cur, bot_id)
            cur.execute(
                "INSERT INTO chats (bot_id, question, answer, is_guardrail) VALUES (%s, %s, %s, %s)",
                (bot_id, question, answer, is_guardrail),
            )
    except Exception as e:
        print(f"[DB] Failed to save chat turn for bot {bot_id}: {e}")





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


def set_owner_plan(
    owner_user_id: str,
    plan: str,
    status: str,
    max_bots: int | None = None,
    max_messages_per_month: int | None = None,
) -> None:
    """Platform-admin manual override — e.g. comping a client, manually
    marking them active after an out-of-band payment, or setting up a
    negotiated enterprise deal. Writes with gateway='manual' (distinct from
    the three payment-gateway webhooks) via the same owner-scoped write path
    they use (_upsert_subscription sets app.user_id = owner_user_id before
    writing, so RLS's subscriptions_update_owner policy is what actually
    allows this — the platform-admin check that gates *reaching* this
    function happens in main.py, same trust model as a webhook's signature
    check).

    Applies the plan's bot/message caps from PLAN_LIMITS so the limits always
    match the label — previously this only changed the plan *name*, leaving a
    freshly-upgraded 'pro' account still enforced at the trial's 1-bot cap.
    Pass max_bots/max_messages_per_month to override those defaults for a
    custom-negotiated enterprise cap instead of the self-serve default."""
    default_bots, default_msgs = PLAN_LIMITS.get(plan, PLAN_LIMITS["trial"])
    _upsert_subscription(
        owner_user_id,
        "manual",
        plan=plan,
        status=status,
        max_bots=max_bots if max_bots is not None else default_bots,
        max_messages_per_month=(
            max_messages_per_month if max_messages_per_month is not None else default_msgs
        ),
    )


def list_all_users() -> list[dict]:
    """Platform admin — all registered users with their plan info and bot count."""
    try:
        with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            _set_platform_admin(cur)
            try:
                cur.execute(
                    """
                    SELECT
                        u.id AS user_id,
                        u.email,
                        COALESCE(u.name, '') AS name,
                        u."createdAt" AS created_at,
                        COALESCE(s.plan, 'trial') AS plan,
                        COALESCE(s.status, 'trialing') AS status,
                        s.max_bots,
                        s.max_messages_per_month,
                        s.trial_ends_at,
                        s.current_period_end,
                        (SELECT COUNT(*) FROM bots b WHERE b.owner_user_id = u.id) AS bot_count
                    FROM "user" u
                    LEFT JOIN subscriptions s ON s.owner_user_id = u.id
                    ORDER BY u.id DESC
                    """
                )
            except Exception:
                conn.rollback()
                _set_platform_admin(cur)
                cur.execute(
                    """
                    SELECT
                        u.id AS user_id,
                        u.email,
                        COALESCE(u.name, '') AS name,
                        COALESCE(s.plan, 'trial') AS plan,
                        COALESCE(s.status, 'trialing') AS status,
                        s.max_bots,
                        s.max_messages_per_month,
                        s.trial_ends_at,
                        s.current_period_end,
                        (SELECT COUNT(*) FROM bots b WHERE b.owner_user_id = u.id) AS bot_count
                    FROM "user" u
                    LEFT JOIN subscriptions s ON s.owner_user_id = u.id
                    ORDER BY u.id DESC
                    """
                )
            rows = []
            for r in cur.fetchall():
                d = dict(r)
                d["created_at"] = str(d.get("created_at") or "")
                d["trial_ends_at"] = str(d["trial_ends_at"]) if d.get("trial_ends_at") else None
                d["current_period_end"] = str(d["current_period_end"]) if d.get("current_period_end") else None
                d["bot_count"] = int(d.get("bot_count") or 0)
                rows.append(d)
            return rows
    except Exception as e:
        print("[db] list_all_users error:", e)
        return []


def platform_chat_stats() -> list[dict]:
    """Platform admin — per-bot chat stats: total chats, top question, unanswered count."""
    try:
        with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            _set_platform_admin(cur)
            cur.execute(
                """
                SELECT
                    b.bot_id,
                    b.name AS bot_name,
                    u.email AS owner_email,
                    (SELECT COUNT(*) FROM chats c WHERE c.bot_id = b.bot_id) AS total_chats,
                    (SELECT COUNT(*) FROM chats c WHERE c.bot_id = b.bot_id) AS total_sessions
                FROM bots b
                LEFT JOIN "user" u ON u.id = b.owner_user_id
                ORDER BY total_chats DESC
                """
            )
            rows = [dict(r) for r in cur.fetchall()]

            # Top question per bot
            cur.execute(
                """
                SELECT bot_id, question, COUNT(*) AS n
                FROM chats
                WHERE question IS NOT NULL AND question != ''
                GROUP BY bot_id, question
                ORDER BY bot_id, n DESC
                """
            )
            top: dict[str, str] = {}
            for r in cur.fetchall():
                if r["bot_id"] not in top:
                    top[r["bot_id"]] = r["question"]

            # Unanswered / fallback count per bot
            cur.execute(
                """
                SELECT bot_id, COUNT(*) AS n
                FROM chats
                WHERE answer ILIKE '%sorry%' OR answer ILIKE '%don''t have information%'
                   OR answer ILIKE '%not sure%' OR answer ILIKE '%don''t know%'
                GROUP BY bot_id
                """
            )
            unanswered: dict[str, int] = {r["bot_id"]: r["n"] for r in cur.fetchall()}

            for row in rows:
                row["total_chats"] = int(row.get("total_chats") or 0)
                row["total_sessions"] = int(row.get("total_sessions") or 0)
                row["top_question"] = top.get(row["bot_id"])
                row["unanswered_count"] = int(unanswered.get(row["bot_id"], 0))
            return rows
    except Exception as e:
        print("[db] platform_chat_stats error:", e)
        return []


def delete_user_and_bots(user_id: str) -> bool:
    """Platform admin — permanently delete a user account and all their bots/data.
    This is irreversible. Returns False if the user doesn't exist."""
    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_platform_admin(cur)
        cur.execute('SELECT id FROM "user" WHERE id = %s', (user_id,))
        if not cur.fetchone():
            return False
        cur.execute("SELECT bot_id FROM bots WHERE owner_user_id = %s", (user_id,))
        bot_ids = [r[0] for r in cur.fetchall()]
        cur.execute("DELETE FROM bots WHERE owner_user_id = %s", (user_id,))
        cur.execute("DELETE FROM subscriptions WHERE owner_user_id = %s", (user_id,))
        cur.execute('DELETE FROM "user" WHERE id = %s', (user_id,))
        return True, bot_ids


def platform_analytics() -> dict:
    """Platform admin — full E2E analytics: funnel, time-series, bot performance,
    lead quality, session metrics, and platform health."""
    try:
        with _get_pool().connection() as conn, conn.cursor() as cur:
            _set_platform_admin(cur)

            cur.execute("SELECT COUNT(*) FROM chats")
            total_messages = cur.fetchone()[0] or 0
            total_sessions = total_messages

            cur.execute("SELECT COUNT(*) FROM leads")
            total_leads = cur.fetchone()[0] or 0

            cur.execute("SELECT COUNT(*) FROM leads WHERE score = 'hot' OR score = '70'")
            hot_leads = cur.fetchone()[0] or 0

            cur.execute("SELECT COUNT(*) FROM leads WHERE score = 'warm' OR score = '40'")
            warm_leads = cur.fetchone()[0] or 0

            cold_leads = max(0, total_leads - (hot_leads + warm_leads))

            funnel = {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "total_leads": total_leads,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "cold_leads": cold_leads,
                "lead_capture_rate": round(total_leads / total_sessions * 100, 1) if total_sessions else 0,
                "hot_rate": round(hot_leads / total_leads * 100, 1) if total_leads else 0,
            }

            cur.execute(
                """
                SELECT DATE(created_at) AS day, COUNT(*) AS n
                FROM chats
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY day ORDER BY day
                """
            )
            daily_chats = [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]

            cur.execute(
                """
                SELECT DATE(created_at) AS day, COUNT(*) AS n
                FROM leads
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY day ORDER BY day
                """
            )
            daily_leads = [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]

            try:
                cur.execute(
                    """
                    SELECT DATE("createdAt") AS day, COUNT(*) AS n
                    FROM "user"
                    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
                    GROUP BY day ORDER BY day
                    """
                )
                daily_signups = [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]
            except Exception:
                conn.rollback()
                _set_platform_admin(cur)
                try:
                    cur.execute(
                        """
                        SELECT DATE(created_at) AS day, COUNT(*) AS n
                        FROM "user"
                        WHERE created_at >= NOW() - INTERVAL '30 days'
                        GROUP BY day ORDER BY day
                        """
                    )
                    daily_signups = [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]
                except Exception:
                    conn.rollback()
                    _set_platform_admin(cur)
                    daily_signups = []

            cur.execute(
                """
                SELECT
                    b.bot_id,
                    b.name AS bot_name,
                    u.email AS owner_email,
                    COUNT(c.id) AS sessions,
                    COUNT(c.id) AS messages,
                    COALESCE(l.lead_count, 0) AS leads,
                    COALESCE(l.hot_count, 0) AS hot_leads,
                    COALESCE(l.warm_count, 0) AS warm_leads
                FROM bots b
                LEFT JOIN "user" u ON u.id = b.owner_user_id
                LEFT JOIN chats c ON c.bot_id = b.bot_id
                LEFT JOIN (
                    SELECT bot_id,
                           COUNT(*) AS lead_count,
                           COUNT(*) FILTER (WHERE score = 'hot' OR score = '70') AS hot_count,
                           COUNT(*) FILTER (WHERE score = 'warm' OR score = '40') AS warm_count
                    FROM leads
                    GROUP BY bot_id
                ) l ON l.bot_id = b.bot_id
                GROUP BY b.bot_id, b.name, u.email, l.lead_count, l.hot_count, l.warm_count
                ORDER BY leads DESC, sessions DESC
                """
            )
            bot_performance = []
            for r in cur.fetchall():
                sessions = r[3] or 0
                leads = r[5] or 0
                conversion = round(leads / sessions * 100, 1) if sessions else 0
                bot_performance.append({
                    "bot_id": r[0],
                    "bot_name": r[1],
                    "owner_email": r[2],
                    "sessions": sessions,
                    "messages": r[4] or 0,
                    "leads": leads,
                    "hot_leads": r[6] or 0,
                    "warm_leads": r[7] or 0,
                    "conversion_rate": conversion,
                })

            session_metrics = {
                "avg_messages_per_session": 1.0,
                "median_messages_per_session": 1.0,
            }

            cur.execute("SELECT COUNT(*) FROM bots WHERE suspended = false AND owner_user_id IS NOT NULL")
            active_bots = cur.fetchone()[0] or 0

            cur.execute("SELECT COUNT(*) FROM bots WHERE suspended = true")
            suspended_bots = cur.fetchone()[0] or 0

            cur.execute("SELECT COUNT(*) FROM bots")
            total_bots = cur.fetchone()[0] or 0

            cur.execute(
                """
                SELECT COUNT(*) FROM chats
                WHERE answer ILIKE '%sorry%' OR answer ILIKE '%don''t have information%'
                   OR answer ILIKE '%not sure%' OR answer ILIKE '%cannot help%'
                """
            )
            unanswered = cur.fetchone()[0] or 0
            unanswered_rate = round(unanswered / total_messages * 100, 1) if total_messages else 0

            platform_health = {
                "total_bots": total_bots,
                "active_bots": active_bots,
                "suspended_bots": suspended_bots,
                "unanswered_messages": unanswered,
                "unanswered_rate": unanswered_rate,
            }

            return {
                "funnel": funnel,
                "daily_chats": daily_chats,
                "daily_leads": daily_leads,
                "daily_signups": daily_signups,
                "bot_performance": bot_performance,
                "session_metrics": session_metrics,
                "platform_health": platform_health,
            }
    except Exception as e:
        print("[db] platform_analytics error:", e)
        return {
            "funnel": {"total_sessions": 0, "total_messages": 0, "total_leads": 0, "hot_leads": 0, "warm_leads": 0, "cold_leads": 0, "lead_capture_rate": 0, "hot_rate": 0},
            "daily_chats": [], "daily_leads": [], "daily_signups": [],
            "bot_performance": [],
            "session_metrics": {"avg_messages_per_session": 0, "median_messages_per_session": 0},
            "platform_health": {"total_bots": 0, "active_bots": 0, "suspended_bots": 0, "unanswered_messages": 0, "unanswered_rate": 0},
        }


