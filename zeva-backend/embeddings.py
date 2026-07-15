"""
Free + local embeddings via fastembed (HuggingFace CDN se model, koi API kharcha
nahi). Hum khud embeddings bana ke ChromaDB ko dete hain — isse ChromaDB ka
default (slow) model kabhi download nahi hota.
"""

from fastembed import TextEmbedding

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=EMBED_MODEL)
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """List of texts → list of embedding vectors (floats)."""
    return [vec.tolist() for vec in _get_model().embed(list(texts))]
