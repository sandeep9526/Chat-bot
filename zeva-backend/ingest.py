"""
Documents ko ChromaDB me store karna — PER BOT (multi-tenant).

Har chunk me `bot_id` tag hota hai, taaki ek client ka data doosre se alag rahe.
documents/<bot_id>/*.txt padhta hai, chunks banata hai, aur ChromaDB me daalta hai.

Chalao:  python ingest.py <bot_id>      (default: acme-salon)
Sirf usi bot ke purane chunks hatte hain — baaki bots ka data safe rehta hai.
"""

import glob
import os
import re
import sys

import chromadb

from embeddings import embed

HERE = os.path.dirname(__file__)
DOCS_ROOT = os.path.join(HERE, "documents")
DB_DIR = os.path.join(HERE, "chroma_db")
COLLECTION = "zeva_docs"

# Defense-in-depth: the frontend's file input already rejects this (a
# .docx's raw zip bytes were found live to have been silently ingested and
# embedded as a bot's entire "knowledge base" — the accept=".txt" filter on
# an <input type=file> is only a UI hint, not enforced by the browser), but
# /ingest is callable directly, so the same check has to exist here too.
_BINARY_SIGNATURES = ("PK", "%PDF", "\x89PNG", "GIF8", "\xff\xd8\xff", "MZ")


def looks_like_binary(text: str) -> bool:
    if text.startswith(_BINARY_SIGNATURES):
        return True
    sample = text[:4000]
    if not sample:
        return False
    suspicious = sum(1 for c in sample if c == "�" or (ord(c) < 32 and c not in "\n\r\t"))
    return suspicious / len(sample) > 0.02


def chunk_text(text: str, size: int = 600) -> list[str]:
    """
    Paragraph-based chunking: har topic (blank line se alag) apna chunk banta hai
    → focused matching (jaise "timings" sirf timings-paragraph se match kare, poore
    doc se nahi). Bahut lambe paragraph ko size-windows me tod dete hain.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    for para in paragraphs:
        para = " ".join(para.split())  # extra whitespace saaf
        if len(para) <= size:
            chunks.append(para)
        else:
            start = 0
            while start < len(para):
                chunks.append(para[start : start + size].strip())
                start += size - 80  # thoda overlap
    return [c for c in chunks if c]


def ingest_bot(bot_id: str) -> dict:
    """Ek bot ke documents/<bot_id>/*.txt ko (re-)index karo. Counts lauta do."""
    docs_dir = os.path.join(DOCS_ROOT, bot_id)
    if not os.path.isdir(docs_dir):
        return {"bot_id": bot_id, "files": 0, "chunks": 0}

    client = chromadb.PersistentClient(path=DB_DIR)
    # cosine space; embeddings hum khud dete hain isliye koi EF nahi.
    col = client.get_or_create_collection(
        COLLECTION, metadata={"hnsw:space": "cosine"}
    )

    # Sirf IS bot ke purane chunks hatao (baaki bots ko haath nahi lagega).
    col.delete(where={"bot_id": bot_id})

    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict] = []

    files = sorted(glob.glob(os.path.join(docs_dir, "*.txt")))
    for path in files:
        fname = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        for i, chunk in enumerate(chunk_text(text)):
            ids.append(f"{bot_id}-{fname}-{i}")  # bot_id id me bhi (unique)
            docs.append(chunk)
            metas.append({"source": fname, "chunk": i, "bot_id": bot_id})

    if docs:
        col.add(ids=ids, documents=docs, metadatas=metas, embeddings=embed(docs))
    return {"bot_id": bot_id, "files": len(files), "chunks": len(docs)}


def _safe_name(filename: str) -> str:
    """Filename ko surakshit banao (path tricks rok do), .txt ensure karo."""
    base = os.path.basename(filename).strip() or "doc"
    base = re.sub(r"[^A-Za-z0-9._-]", "-", base)
    if not base.lower().endswith(".txt"):
        base += ".txt"
    return base


def save_and_ingest(bot_id: str, filename: str, text: str) -> dict:
    """Text ko documents/<bot_id>/<filename> me save karo, phir bot re-index karo.
    Raises ValueError if `text` looks like binary data, not real text."""
    if looks_like_binary(text):
        raise ValueError(
            "Ye content text nahi lagta (.docx/.pdf/image ho sakta hai). "
            "Plain text paste karo ya .txt file upload karo."
        )
    docs_dir = os.path.join(DOCS_ROOT, bot_id)
    os.makedirs(docs_dir, exist_ok=True)
    with open(os.path.join(docs_dir, _safe_name(filename)), "w", encoding="utf-8") as f:
        f.write(text)
    return ingest_bot(bot_id)


if __name__ == "__main__":
    bot = sys.argv[1] if len(sys.argv) > 1 else "acme-salon"
    result = ingest_bot(bot)
    print(f"✓ [{result['bot_id']}] {result['chunks']} chunks from {result['files']} files stored")
