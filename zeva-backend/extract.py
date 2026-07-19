"""
Extract plain text from uploaded knowledge files, so a bot can be trained on
real documents — PDFs, Word docs, Markdown, text — not just pasted text.

Document formats (txt / md / pdf / docx) are parsed here with pure-Python libs
and no system dependencies. Images (png / jpg) are handled by the caller via a
vision model instead, because that needs the OpenRouter client that lives in
main.py — see extract_image_text there.
"""
from __future__ import annotations

import io
import os

TEXT_EXTS = {".txt", ".md", ".markdown", ".text"}
PDF_EXTS = {".pdf"}
DOCX_EXTS = {".docx"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}

# Everything the uploader accepts — used for the file picker + error messages.
SUPPORTED_EXTS = TEXT_EXTS | PDF_EXTS | DOCX_EXTS | IMAGE_EXTS


def file_ext(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def is_image(filename: str) -> bool:
    return file_ext(filename) in IMAGE_EXTS


def _extract_txt(data: bytes) -> str:
    # Decode as UTF-8, fall back to latin-1 so odd bytes never crash the upload.
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1", errors="replace")


def _extract_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        t = page.extract_text() or ""
        if t.strip():
            parts.append(t)
    return "\n\n".join(parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    # Pull table cells too — pricing/hours are often laid out in tables.
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                parts.append(" | ".join(cells))
    return "\n".join(parts)


def extract_document_text(filename: str, data: bytes) -> str:
    """Extract text from a non-image knowledge file. Raises ValueError on an
    unsupported type or when the file yields no readable text (e.g. a scanned
    PDF with no text layer)."""
    ext = file_ext(filename)
    if ext in TEXT_EXTS:
        text = _extract_txt(data)
    elif ext in PDF_EXTS:
        text = _extract_pdf(data)
    elif ext in DOCX_EXTS:
        text = _extract_docx(data)
    elif ext == ".doc":
        raise ValueError(
            "Old .doc files aren't supported — open it and 'Save As' .docx or "
            "PDF, then upload again."
        )
    else:
        raise ValueError(
            f"'{ext or 'That file'}' isn't supported. Upload a PDF, Word (.docx), "
            "text, Markdown, PNG or JPG file."
        )
    text = text.strip()
    if len(text) < 3:
        raise ValueError(
            "Couldn't find readable text in that file. If it's a scanned page, "
            "upload it as an image (PNG/JPG) instead so we can read it."
        )
    return text
