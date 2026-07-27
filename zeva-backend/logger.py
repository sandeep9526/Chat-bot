import logging
import re
from typing import Any

# Initialize secure platform logger
_logger = logging.getLogger("zeva.pii_guard")
_logger.setLevel(logging.INFO)
if not _logger.handlers:
    _handler = logging.StreamHandler()
    _formatter = logging.Formatter("[%(asctime)s] %(levelname)s [%(name)s] %(message)s")
    _handler.setFormatter(_formatter)
    _logger.addHandler(_handler)

def scrub_pii(text: Any, mask_phones: bool = False) -> str:
    """
    Sanitizes visitor strings, database queries, and log statements by automatically
    intercepting and replacing PCI-DSS, HIPAA, and financial PII tokens with structural placeholders.
    """
    if not text or not isinstance(text, str):
        return str(text or "")
    
    # 1. Credit Card sequences (4 group 16-digit cards with optional hyphens/spaces)
    text = re.sub(r"\b(?:\d{4}[ -]?){3}\d{4}\b", "[REDACTED_CARD]", text)
    
    # 2. Major card formats (Amex 15-digit, Visa/MasterCard plain)
    text = re.sub(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b", "[REDACTED_CARD]", text)
    
    # 3. US Social Security Numbers (SSN: XXX-XX-XXXX or digits)
    text = re.sub(r"\b\d{3}[ -]?\d{2}[ -]?\d{4}\b", "[REDACTED_SSN]", text)
    
    # 4. Financial IBAN tokens and Bank Routing sequences
    text = re.sub(r"\b[A-Z]{2}\d{2}[ -]?(?:[A-Z0-9]{4}[ -]?){2,5}[A-Z0-9]{1,4}\b", "[REDACTED_IBAN]", text, flags=re.IGNORECASE)

    if mask_phones:
        # Mask international & standard telephone formatting in standard outputs/logs
        text = re.sub(r"\b(?:\+?\d{1,3}[ -.]?)?\(?\d{3}\)?[ -.]?\d{3}[ -.]?\d{4}\b", "[REDACTED_PHONE]", text)

    return text

def secure_print(*args: Any, **kwargs: Any) -> None:
    """
    Drop-in replacement for standard print() that intercepts and applies Regex pattern redactors
    before streaming output to console, Cloudwatch, or aggregation pipelines.
    """
    scrubbed_args = [scrub_pii(str(arg), mask_phones=True) for arg in args]
    print(*scrubbed_args, **kwargs)

def log_info(msg: Any, *args: Any, **kwargs: Any) -> None:
    _logger.info(scrub_pii(str(msg), mask_phones=True), *args, **kwargs)

def log_error(msg: Any, *args: Any, **kwargs: Any) -> None:
    _logger.error(scrub_pii(str(msg), mask_phones=True), *args, **kwargs)

def log_warning(msg: Any, *args: Any, **kwargs: Any) -> None:
    _logger.warning(scrub_pii(str(msg), mask_phones=True), *args, **kwargs)
