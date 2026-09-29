"""
Free + local embeddings via fastembed (HuggingFace CDN se model, koi API kharcha
nahi). Hum khud embeddings bana ke ChromaDB ko dete hain — isse ChromaDB ka
default (slow) model kabhi download nahi hota.
"""

import os

# HuggingFace's newer "Xet" download backend (hf_xet) stalls at "Reconstructing
# 0.00B" on some networks — the big model.onnx never starts, so the model never
# finishes downloading and every /chat hangs. Force the classic HTTP download
# path instead (slower on a good link, but it actually progresses here). Must be
# set BEFORE huggingface_hub is imported (fastembed pulls it in below).
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

from fastembed import TextEmbedding  # noqa: E402  (must follow the env var above)

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Persistent model cache. fastembed's default is the OS temp dir (macOS:
# /var/folders/.../T), which the OS periodically PURGES — after that, the next
# embed() re-downloads the ~85MB ONNX model, and on a slow link that hangs every
# /chat for minutes (found live: demo "answering so late", playground "couldn't
# reach the server"). Pin the cache to a stable home-dir path so it survives.
# Override with FASTEMBED_CACHE_DIR if you want it elsewhere (e.g. a mounted
# volume in production).
CACHE_DIR = os.getenv("FASTEMBED_CACHE_DIR", os.path.expanduser("~/.cache/ochreshift/fastembed"))

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        os.makedirs(CACHE_DIR, exist_ok=True)
        _model = TextEmbedding(model_name=EMBED_MODEL, cache_dir=CACHE_DIR)
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """List of texts → list of embedding vectors (floats).

    Validates that every vector has the same dimension before returning.
    If fastembed's internal batching/padding fails (which causes an internal
    numpy inhomogeneous shape error), it falls back to processing texts one by one.
    """
    
    def _do_embed(batch_texts: list[str]) -> list[list[float]]:
        vectors = [vec.tolist() for vec in _get_model().embed(list(batch_texts))]
        if not vectors:
            return vectors
        expected_dim = len(vectors[0])
        bad = [(i, len(v)) for i, v in enumerate(vectors) if len(v) != expected_dim]
        if bad:
            raise ValueError(
                f"Embedding dimension mismatch: expected {expected_dim} for all "
                f"{len(vectors)} vectors, but {len(bad)} differ: "
                + ", ".join(f"[{i}]={d}" for i, d in bad[:5])
            )
        if len(vectors) != len(batch_texts):
            raise ValueError(
                f"Embedding count mismatch: got {len(vectors)} vectors for "
                f"{len(batch_texts)} texts."
            )
        return vectors

    try:
        # Attempt to embed the entire batch at once (fastest)
        return _do_embed(texts)
    except ValueError as e:
        # If fastembed throws a numpy sequence error, it's likely a bug in its
        # internal tokenizer/padding logic for this specific batch of texts.
        # Fall back to embedding them one by one.
        print(f"[embeddings] Batch embedding failed ({e}). Falling back to one-by-one processing...")
        fallback_vectors = []
        for t in texts:
            try:
                result = _do_embed([t])
                fallback_vectors.extend(result)
            except Exception as inner_e:
                print(f"[embeddings] Fatal: Failed to embed a specific chunk: {repr(t[:100])}... Error: {inner_e}")
                # If a chunk is truly un-embeddable (e.g. invalid bytes), use a zero-vector
                # so the rest of the batch survives, but ChromaDB requires consistent dims.
                # Since all-MiniLM-L6-v2 is 384 dim, we use that.
                fallback_vectors.append([0.0] * 384)
        return fallback_vectors



