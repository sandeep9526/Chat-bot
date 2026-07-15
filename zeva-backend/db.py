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
        _pool = ConnectionPool(os.getenv("APP_DATABASE_URL"), min_size=1, max_size=5, open=True)
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


# ---- reads / writes --------------------------------------------------------
def get_bot(bot_id: str) -> dict | None:
    """Public lookup — used by /config, /chat, /lead. Scoped to exactly this
    bot_id; RLS blocks reading any other bot through this path."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_public_bot(cur, bot_id)
        cur.execute("SELECT * FROM bots WHERE bot_id = %s", (bot_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_bot_for_owner(bot_id: str, owner_user_id: str) -> dict | None:
    """Admin-path lookup — returns None if the bot doesn't exist OR isn't
    owned by this user (RLS enforces the latter; same either way to the
    caller, so main.py can turn both into an honest 404)."""
    with _get_pool().connection() as conn, conn.cursor(row_factory=dict_row) as cur:
        _set_owner(cur, owner_user_id)
        cur.execute("SELECT * FROM bots WHERE bot_id = %s", (bot_id,))
        row = cur.fetchone()
        return dict(row) if row else None


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
    someone else's bot_id — raises psycopg.errors.InsufficientPrivilege."""
    import json

    with _get_pool().connection() as conn, conn.cursor() as cur:
        _set_owner(cur, owner_user_id)
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
