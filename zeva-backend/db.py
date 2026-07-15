"""
Chhota SQLite database — bots, leads, chats. (1-3 client tak kaafi; aage
Postgres pe shift karenge.) Sab kuch `bot_id` ke saath save hota hai taaki
multi-tenant (har client alag) ka base ready rahe.
"""

import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "zeva.db")


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # rows ko dict jaisa access karne ke liye
    return conn


def init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS bots (
              bot_id          TEXT PRIMARY KEY,
              name            TEXT,
              accent          TEXT DEFAULT '#4f46e5',
              welcome         TEXT,
              suggestions     TEXT,   -- JSON array of strings
              allowed_domains TEXT,   -- JSON array; ["*"] = sab allowed
              created_at      TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS leads (
              id         INTEGER PRIMARY KEY AUTOINCREMENT,
              bot_id     TEXT NOT NULL,
              name       TEXT,
              email      TEXT,
              phone      TEXT,
              message    TEXT,
              score      TEXT DEFAULT 'cold',   -- hot / warm / cold
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS chats (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              bot_id       TEXT NOT NULL,
              question     TEXT,
              answer       TEXT,
              is_guardrail INTEGER DEFAULT 0,
              created_at   TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS handoffs (
              id         INTEGER PRIMARY KEY AUTOINCREMENT,
              bot_id     TEXT NOT NULL,
              name       TEXT,
              contact    TEXT,
              summary    TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        # Purane DB (jisme score column nahi tha) ke liye safe migration.
        cols = [r[1] for r in c.execute("PRAGMA table_info(leads)").fetchall()]
        if "score" not in cols:
            c.execute("ALTER TABLE leads ADD COLUMN score TEXT DEFAULT 'cold'")
    _seed_default_bot()


def _seed_default_bot() -> None:
    """Demo bot (acme-salon) ek baar daal do agar nahi hai."""
    with _conn() as c:
        exists = c.execute(
            "SELECT 1 FROM bots WHERE bot_id = ?", ("acme-salon",)
        ).fetchone()
        if exists:
            return
        c.execute(
            "INSERT INTO bots (bot_id, name, accent, welcome, suggestions, allowed_domains)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                "acme-salon",
                "Acme Salon",
                "#4f46e5",
                "Ask in your own words — every answer comes from Acme Salon's own documents.",
                json.dumps(
                    ["What are your hours?", "How much is a haircut?", "Do you take walk-ins?"]
                ),
                json.dumps(["*"]),
            ),
        )


# ---- reads / writes --------------------------------------------------------
def get_bot(bot_id: str) -> dict | None:
    with _conn() as c:
        row = c.execute("SELECT * FROM bots WHERE bot_id = ?", (bot_id,)).fetchone()
        return dict(row) if row else None


def list_bots() -> list[dict]:
    with _conn() as c:
        rows = c.execute("SELECT bot_id, name, accent FROM bots ORDER BY bot_id").fetchall()
        return [dict(r) for r in rows]


def upsert_bot(
    bot_id: str,
    name: str,
    accent: str = "#4f46e5",
    welcome: str = "",
    suggestions: list[str] | None = None,
    allowed_domains: list[str] | None = None,
) -> None:
    """Naya bot banao (ya mojood ko update). Onboarding ka base."""
    with _conn() as c:
        c.execute(
            """
            INSERT INTO bots (bot_id, name, accent, welcome, suggestions, allowed_domains)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(bot_id) DO UPDATE SET
              name = excluded.name, accent = excluded.accent,
              welcome = excluded.welcome, suggestions = excluded.suggestions,
              allowed_domains = excluded.allowed_domains
            """,
            (
                bot_id,
                name,
                accent,
                welcome,
                json.dumps(suggestions or []),
                json.dumps(allowed_domains or ["*"]),
            ),
        )


def save_lead(
    bot_id: str,
    name: str,
    email: str,
    phone: str | None,
    message: str | None,
    score: str = "cold",
) -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO leads (bot_id, name, email, phone, message, score) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (bot_id, name, email, phone, message, score),
        )
        return int(cur.lastrowid)


def save_handoff(bot_id: str, name: str, contact: str, summary: str) -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO handoffs (bot_id, name, contact, summary) VALUES (?, ?, ?, ?)",
            (bot_id, name, contact, summary),
        )
        return int(cur.lastrowid)


def list_handoffs(bot_id: str) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM handoffs WHERE bot_id = ? ORDER BY id DESC LIMIT 20", (bot_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def list_leads(bot_id: str) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM leads WHERE bot_id = ? ORDER BY id DESC", (bot_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def save_chat(bot_id: str, question: str, answer: str, is_guardrail: bool) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO chats (bot_id, question, answer, is_guardrail) VALUES (?, ?, ?, ?)",
            (bot_id, question, answer, 1 if is_guardrail else 0),
        )


def stats(bot_id: str) -> dict:
    """Dashboard ke numbers: leads, warm leads, chats, unanswered, top sawaal."""
    with _conn() as c:
        one = lambda q: c.execute(q, (bot_id,)).fetchone()[0]  # noqa: E731
        leads = one("SELECT COUNT(*) FROM leads WHERE bot_id = ?")
        # hot + warm = "ready to buy" leads (Phase 05 scoring).
        hot = one("SELECT COUNT(*) FROM leads WHERE bot_id = ? AND score = 'hot'")
        warm = one(
            "SELECT COUNT(*) FROM leads WHERE bot_id = ? AND score IN ('hot','warm')"
        )
        chats = one("SELECT COUNT(*) FROM chats WHERE bot_id = ?")
        # "pata nahi" wale sawaal = docs me kya missing hai (sona!).
        unanswered = c.execute(
            "SELECT COUNT(*) FROM chats WHERE bot_id = ? AND is_guardrail = 1", (bot_id,)
        ).fetchone()[0]
        top = c.execute(
            "SELECT question, COUNT(*) n FROM chats WHERE bot_id = ? "
            "GROUP BY question ORDER BY n DESC LIMIT 6",
            (bot_id,),
        ).fetchall()
        return {
            "leads": leads,
            "warmLeads": warm,
            "chats": chats,
            "unanswered": unanswered,
            "topQuestions": [{"question": r[0], "count": r[1]} for r in top],
        }
