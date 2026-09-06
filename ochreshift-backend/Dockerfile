# --- Build stage ---
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Runtime stage ---
FROM python:3.12-slim

WORKDIR /app

# Copy installed deps from builder
COPY --from=builder /install /usr/local

# Non-root user for security
RUN addgroup --system ochreshift && adduser --system --ingroup ochreshift ochreshift

# Copy application code with proper ownership
COPY --chown=ochreshift:ochreshift . .

# Create a dedicated, writable directory for persistent data (documents and ChromaDB)
RUN mkdir -p /data && chown -R ochreshift:ochreshift /data

# Point the app to use the writable /data directory
ENV OCHRESHIFT_DOCS_DIR=/data/documents
ENV CHROMA_DB_DIR=/data/chroma_db
# Give the ochreshift user a writable home directory so libraries trying to access ~ don't crash at /nonexistent
ENV HOME=/data
ENV FASTEMBED_CACHE_DIR=/data/fastembed_cache
# Tell HuggingFace to use a writable cache directory
ENV HF_HOME=/data/hf_cache

USER ochreshift

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
