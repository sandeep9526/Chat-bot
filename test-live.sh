#!/bin/bash
# Zeva Live Server Test - Backend start karke endpoints test karo
cd "$(dirname "$0")/zeva-backend"

echo "========================================="
echo "  ZEVA LIVE SERVER TEST"
echo "========================================="

# Kill existing server
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

echo ""
echo "Starting backend server..."
venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 &
SERVER_PID=$!
sleep 4

echo ""
echo "Testing endpoints..."
echo ""

# Test 1: Health check
echo -n "[1] Health check: "
RESP=$(curl -s http://127.0.0.1:8000/health)
if echo "$RESP" | grep -q '"status"'; then
    echo "✅ PASS - $RESP"
else
    echo "❌ FAIL - $RESP"
fi

# Test 2: Runtime config
echo -n "[2] Runtime config: "
RESP=$(curl -s http://127.0.0.1:8000/api/env-config)
if echo "$RESP" | grep -q 'apiUrl'; then
    echo "✅ PASS - $RESP"
else
    echo "❌ FAIL - $RESP"
fi

# Test 3: SSRF protection
echo -n "[3] SSRF protection: "
RESP=$(curl -s -X POST http://127.0.0.1:8000/demo/ingest-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}')
if echo "$RESP" | grep -q "Private"; then
    echo "✅ PASS - Blocked private IP"
else
    echo "❌ FAIL - $RESP"
fi

# Test 4: SSRF - block ftp
echo -n "[4] SSRF block ftp: "
RESP=$(curl -s -X POST http://127.0.0.1:8000/demo/ingest-url \
  -H "Content-Type: application/json" \
  -d '{"url": "ftp://evil.com/steal"}')
if echo "$RESP" | grep -q "Only http"; then
    echo "✅ PASS - Blocked FTP"
else
    echo "❌ FAIL - $RESP"
fi

# Test 5: SSRF - allow valid URL
echo -n "[5] SSRF allow valid: "
RESP=$(curl -s -X POST http://127.0.0.1:8000/demo/ingest-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}')
if echo "$RESP" | grep -q 'ok.*true\|"ok": true'; then
    echo "✅ PASS - Allowed valid URL"
else
    echo "❌ FAIL - $RESP"
fi

# Test 6: Feedback endpoint
echo -n "[6] Feedback endpoint: "
RESP=$(curl -s -X POST http://127.0.0.1:8000/chat/feedback \
  -H "Content-Type: application/json" \
  -d '{"botId": "test-bot", "score": 1, "answer": "test answer"}')
if echo "$RESP" | grep -q 'ok'; then
    echo "✅ PASS - $RESP"
else
    echo "❌ FAIL - $RESP"
fi

# Test 7: Config endpoint
echo -n "[7] Widget config: "
RESP=$(curl -s "http://127.0.0.1:8000/config?botId=zeva-ai")
if echo "$RESP" | grep -q 'name'; then
    echo "✅ PASS - Config loads"
else
    echo "❌ FAIL - $RESP"
fi

# Stop server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "========================================="
echo "  LIVE SERVER TESTS COMPLETE"
echo "========================================="
