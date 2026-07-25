"""
Debug script — ChromaDB me stored data check karo.
Run:  python debug_chromadb.py
"""
import os
import chromadb

HERE = os.path.dirname(__file__)
DB_DIR = os.getenv("CHROMA_DB_DIR", os.path.join(HERE, "chroma_db"))
COLLECTION = "zeva_docs"

print(f"ChromaDB path: {DB_DIR}")
print(f"Collection: {COLLECTION}")
print()

if not os.path.isdir(DB_DIR):
    print("ERROR: ChromaDB directory does NOT exist!")
    print("This means no documents have ever been ingested.")
    exit(1)

client = chromadb.PersistentClient(path=DB_DIR)

try:
    col = client.get_collection(COLLECTION)
except Exception as e:
    print(f"ERROR: Collection '{COLLECTION}' does not exist: {e}")
    exit(1)

count = col.count()
print(f"Total chunks in collection: {count}")
print()

if count == 0:
    print("Collection is EMPTY — no documents ingested yet!")
    exit(1)

# List all unique bot_ids
all_data = col.get()
metas = all_data.get("metadatas", [])
bot_ids = set(m.get("bot_id", "UNKNOWN") for m in metas)
print(f"Unique bot_ids: {sorted(bot_ids)}")
print()

# Show chunks per bot
for bid in sorted(bot_ids):
    results = col.get(where={"bot_id": bid})
    docs = results.get("documents", [])
    print(f"--- bot_id: '{bid}' → {len(docs)} chunks ---")
    for i, doc in enumerate(docs[:3]):
        print(f"  [{i}] {doc[:120]}...")
    if len(docs) > 3:
        print(f"  ... and {len(docs) - 3} more chunks")
    print()

# Test retrieval for demo-restaurant
print("=" * 60)
print("TESTING RETRIEVAL for bot_id='demo-restaurant'")
print("=" * 60)
try:
    from embeddings import embed
    query = "What services do you offer?"
    query_emb = embed([query])
    res = col.query(
        query_embeddings=query_emb,
        n_results=3,
        where={"bot_id": "demo-restaurant"},
    )
    docs = res.get("documents", [[]])[0]
    dists = res.get("distances", [[]])[0]
    print(f"Query: '{query}'")
    print(f"Results: {len(docs)} hits")
    for i, (doc, dist) in enumerate(zip(docs, dists)):
        match = max(0, min(100, round((1 - dist) * 100)))
        print(f"  [{i}] match={match}% dist={dist:.4f} → {doc[:120]}...")
except Exception as e:
    print(f"RETRIEVAL FAILED: {e}")
