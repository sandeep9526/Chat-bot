"""
Shared pytest fixtures. Tests run against the REAL Neon database (via the
app's own APP_DATABASE_URL) and the real ChromaDB store — there's no mocked
DB layer, because the whole point of most of these tests is proving
Row-Level Security actually isolates tenants, which a mock can't verify.

Test bots are created UNOWNED (owner_user_id NULL), same as the seed demo
bots (acme-salon etc.) — this lets the core smoke tests run without needing
a live Better Auth session / Next.js server, since public endpoints
(/chat, /lead, /config) don't require auth. Auth-boundary tests only need
to prove a MISSING token is rejected, which doesn't need a real token either.

Run with: cd zeva-backend && venv/bin/pytest tests/ -v
"""

import os
import sys

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

import chromadb  # noqa: E402
import psycopg  # noqa: E402

import main  # noqa: E402
from embeddings import embed  # noqa: E402

ADMIN_DB_URL = os.getenv("DATABASE_URL")


@pytest.fixture(scope="session")
def client():
    return TestClient(main.app)


def _seed_bot(bot_id: str, name: str, docs: dict[str, str]) -> None:
    """Create an unowned test bot with real embedded content — bypasses
    /admin/create-bot and /ingest (which need a real JWT) since these are
    public-endpoint tests. Mirrors exactly what ingest.py does."""
    with psycopg.connect(ADMIN_DB_URL) as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO bots (bot_id, owner_user_id, name) VALUES (%s, NULL, %s) "
            "ON CONFLICT (bot_id) DO UPDATE SET name = excluded.name",
            (bot_id, name),
        )
        conn.commit()

    col = chromadb.PersistentClient(path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")).get_or_create_collection(
        "zeva_docs", metadata={"hnsw:space": "cosine"}
    )
    col.delete(where={"bot_id": bot_id})
    ids, texts, metas = [], [], []
    for fname, text in docs.items():
        ids.append(f"{bot_id}-{fname}-0")
        texts.append(text)
        metas.append({"source": fname, "chunk": 0, "bot_id": bot_id})
    if texts:
        col.add(ids=ids, documents=texts, metadatas=metas, embeddings=embed(texts))


def _cleanup_bot(bot_id: str) -> None:
    with psycopg.connect(ADMIN_DB_URL) as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM bots WHERE bot_id = %s", (bot_id,))
        conn.commit()
    try:
        col = chromadb.PersistentClient(path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")).get_collection("zeva_docs")
        col.delete(where={"bot_id": bot_id})
    except Exception:
        pass


@pytest.fixture(scope="module")
def salon_bot():
    """An unowned test bot with salon content — separate from acme-salon so
    tests don't depend on / interfere with the real seed data."""
    bot_id = "test-suite-salon"
    _seed_bot(
        bot_id,
        "Test Suite Salon",
        {
            "info.txt": "Test Suite Salon offers haircuts for Rs. 499 and hair coloring for Rs. 1200. "
            "We are open Monday to Saturday, 10am to 7pm.",
        },
    )
    yield bot_id
    _cleanup_bot(bot_id)


@pytest.fixture(scope="module")
def dental_bot():
    """A second unowned test bot with UNRELATED content, for isolation tests."""
    bot_id = "test-suite-dental"
    _seed_bot(
        bot_id,
        "Test Suite Dental",
        {
            "info.txt": "Test Suite Dental offers root canal treatment for Rs. 3500 and teeth cleaning for Rs. 800. "
            "We are open all days except Sunday.",
        },
    )
    yield bot_id
    _cleanup_bot(bot_id)
