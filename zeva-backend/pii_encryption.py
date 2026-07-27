"""
PII encryption utilities for at-rest sensitive data protection.

Uses Fernet symmetric encryption (AES-128-CBC) with a key derived from
the PII_ENCRYPTION_KEY environment variable. When the key is not set,
all functions gracefully pass through (no-op mode) for local dev ease.

Set PII_ENCRYPTION_KEY in production:
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

import os

_fernet = None


def _get_fernet():
    """Lazy-init Fernet cipher from env var. Returns None if not configured."""
    global _fernet
    if _fernet is not None:
        return _fernet
    key = os.getenv("PII_ENCRYPTION_KEY")
    if not key:
        return None
    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        return None
    return _fernet


def encrypt_field(value: str | None) -> str | None:
    """Encrypt a plaintext field value. Returns None if None or no key configured."""
    if not value:
        return value
    cipher = _get_fernet()
    if cipher is None:
        return value  # No-op: pass through in dev mode
    return cipher.encrypt(value.encode()).decode()


def decrypt_field(value: str | None) -> str | None:
    """Decrypt an encrypted field value. Returns None if None or no key configured."""
    if not value:
        return value
    cipher = _get_fernet()
    if cipher is None:
        return value  # No-op: pass through in dev mode
    try:
        return cipher.decrypt(value.encode()).decode()
    except Exception:
        return value  # If decryption fails, return as-is (maybe plaintext from dev)


def mask_email(email: str | None) -> str | None:
    """Pseudonymize email for display: j***@gmail.com"""
    if not email or "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if len(local) <= 1:
        return f"*@{domain}"
    return f"{local[0]}***@{domain}"


def mask_phone(phone: str | None) -> str | None:
    """Pseudonymize phone for display: +1-555-****-0199"""
    if not phone:
        return phone
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) <= 4:
        return "****"
    return f"{'*' * (len(digits) - 4)}{digits[-4:]}"


def mask_name(name: str | None) -> str | None:
    """Pseudonymize name for display: J*** D***"""
    if not name:
        return name
    parts = name.split()
    return " ".join(f"{p[0]}***" if p else "" for p in parts)
