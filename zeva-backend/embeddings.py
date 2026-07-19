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
CACHE_DIR = os.getenv(
    "FASTEMBED_CACHE_DIR", os.path.expanduser("~/.cache/zeva/fastembed")
)

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        os.makedirs(CACHE_DIR, exist_ok=True)
        _model = TextEmbedding(model_name=EMBED_MODEL, cache_dir=CACHE_DIR)
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """List of texts → list of embedding vectors (floats)."""
    return [vec.tolist() for vec in _get_model().embed(list(texts))]
