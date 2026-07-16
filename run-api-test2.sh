#!/bin/bash
cd /home/z/my-project

if ! ss -tlnp | grep -q 3000; then
  NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
  sleep 2
fi

# Get token properly (strip quotes)
TOKEN=$(agent-browser eval "JSON.parse(localStorage.getItem('rapigo-auth')).state.token" 2>&1 | tr -d '"')
echo "TOKEN length: ${#TOKEN}"
echo "TOKEN start: ${TOKEN:0:20}"

echo ""
echo "=== Testing with fixed token ==="
echo "--- /api/stats ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/stats" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/merchants ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/merchants" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/drivers ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/drivers" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/orders ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/orders" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/users ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/users" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/coupons ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/coupons" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/support ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/support" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/audit-logs ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/audit-logs" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "--- /api/notifications ---"
curl -s -w "\nHTTP %{http_code}\n" "http://127.0.0.1:3000/api/notifications" -H "Authorization: Bearer $TOKEN" 2>&1 | head -3

echo "=== DONE ==="