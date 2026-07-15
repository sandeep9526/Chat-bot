"""
RAG retrieval — ChromaDB me se sawaal se related document chunks laata hai.
Embeddings wahi free/local model banata hai jo ingest.py ne use kiya.
"""

import os

import chromadb

from embeddings import embed

HERE = os.path.dirname(__file__)
DB_DIR = os.path.join(HERE, "chroma_db")
COLLECTION = "zeva_docs"

_col = None


def get_collection():
    """Collection ek hi baar khol ke reuse karo (fast)."""
    global _col
    if _col is None:
        client = chromadb.PersistentClient(path=DB_DIR)
        _col = client.get_collection(COLLECTION)
    return _col


def retrieve(query: str, bot_id: str, k: int = 3) -> list[dict]:
    """
    Top-k relevant chunks — SIRF is bot_id ke documents me se (multi-tenant
    isolation). Har hit me:
      file      → kaunsi document se aaya
      match     → similarity % (0-100)
      snip      → chunk ka text (proof card me dikhta hai)
      highlight → snip ka pehla vaakya (mark hone ke liye)
    """
    col = get_collection()
    # ⚠️ where={"bot_id": ...} = ek client ka data doosre ko kabhi nahi milega.
    res = col.query(
        query_embeddings=embed([query]),
        n_results=k,
        where={"bot_id": bot_id},
    )

    docs = res["documents"][0]
    metas = res["metadatas"][0]
    dists = res["distances"][0]

    hits: list[dict] = []
    for doc, meta, dist in zip(docs, metas, dists):
        match = max(0, min(100, round((1 - dist) * 100)))  # cosine distance → %
        first = doc.split(". ")[0].strip()
        highlight = first if first.endswith(".") else first + "."
        if highlight not in doc:
            highlight = doc[:60]
        hits.append(
            {
                "file": meta["source"],
                "match": match,
                "text": doc,           # poora chunk — LLM ke context ke liye
                "snip": doc[:220],     # chhota — proof card display ke liye
                "highlight": highlight[:120],
            }
        )
    return hits
