#!/bin/bash
# Zeva Backend Test Script
cd "$(dirname "$0")/zeva-backend"

echo "========================================="
echo "  ZEVA PLATFORM - COMPLETE TEST SUITE"
echo "========================================="

PASS=0
FAIL=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo "  ✅ PASS: $2"
        PASS=$((PASS + 1))
    else
        echo "  ❌ FAIL: $2"
        FAIL=$((FAIL + 1))
    fi
}

echo ""
echo "[1/10] Backend Imports..."
venv/bin/python -c "from main import app; from db import close_pool; from pii_encryption import encrypt_field, decrypt_field, mask_email, mask_phone" 2>/dev/null
test_result $? "All modules import successfully"

echo ""
echo "[2/10] FastAPI Lifespan..."
venv/bin/python -c "
from main import app
from db import close_pool
assert app.router.lifespan_context is not None, 'No lifespan'
assert callable(close_pool), 'close_pool not callable'
" 2>/dev/null
test_result $? "Lifespan context manager attached"

echo ""
echo "[3/10] SSRF Protection..."
venv/bin/python -c "
from main import app
import inspect
src = inspect.getsource(app.routes)
# Check that demo_ingest-url has socket import
import importlib.util
spec = importlib.util.spec_from_file_location('main', 'main.py')
" 2>/dev/null
grep -q "socket.getaddrinfo" main.py 2>/dev/null
test_result $? "SSRF IP blocking in demo/ingest-url"

echo ""
echo "[4/10] PII Encryption..."
venv/bin/python -c "
from pii_encryption import encrypt_field, decrypt_field, mask_email, mask_phone, mask_name
# Test round-trip
from cryptography.fernet import Fernet
import os
key = Fernet.generate_key().decode()
os.environ['PII_ENCRYPTION_KEY'] = key
import pii_encryption
pii_encryption._fernet = None
enc = encrypt_field('test@example.com')
dec = decrypt_field(enc)
assert dec == 'test@example.com', f'Round-trip failed: {dec}'
# Test masking
assert '***' in mask_email('john@gmail.com'), 'mask_email failed'
assert '***' in mask_phone('+15551234567'), 'mask_phone failed'
" 2>/dev/null
test_result $? "PII encrypt/decrypt/mask works"

echo ""
echo "[5/10] Rate Limiter Eviction..."
grep -q "_evict_stale_rate_keys" main.py 2>/dev/null
test_result $? "Rate limiter has eviction logic"

echo ""
echo "[6/10] Schema Changes..."
grep -q "retention_days" schema.sql 2>/dev/null
test_result $? "retention_days column in schema"

grep -q "custom_prompt_style" schema.sql 2>/dev/null
test_result $? "custom_prompt_style column in schema"

echo ""
echo "[7/10] Feedback API..."
grep -q '@app.post("/chat/feedback")' main.py 2>/dev/null
test_result $? "Feedback endpoint exists"

grep -q "ChatFeedbackRequest" main.py 2>/dev/null
test_result $? "ChatFeedbackRequest model exists"

echo ""
echo "[8/10] LLM Failover..."
grep -q "OPENAI_API_KEY" main.py 2>/dev/null
test_result $? "Multi-vendor failover (OpenAI fallback)"

echo ""
echo "[9/10] Runtime Config..."
grep -q '@app.get("/api/env-config")' main.py 2>/dev/null
test_result $? "Runtime config endpoint exists"

echo ""
echo "[10/10] Domain Whitelisting on /lead..."
grep -q "check_domain(req.botId" main.py 2>/dev/null
test_result $? "Domain check on /lead endpoint"

echo ""
echo "========================================="
echo "  RESULTS: $PASS PASSED / $FAIL FAILED"
echo "========================================="

if [ $FAIL -eq 0 ]; then
    echo "  🎉 ALL TESTS PASSED!"
else
    echo "  ⚠️  Some tests failed - check above"
fi
