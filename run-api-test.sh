#!/bin/bash
cd /home/z/my-project

if ! ss -tlnp | grep -q 3000; then
  NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
  sleep 2
fi

# Get the auth token from the browser
TOKEN=$(agent-browser eval "JSON.parse(localStorage.getItem('rapigo-auth')).state.token" 2>&1)
echo "TOKEN: ${TOKEN:0:20}..."

echo "=== /api/stats ==="
curl -s http://127.0.0.1:3000/api/stats -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/merchants ==="
curl -s http://127.0.0.1:3000/api/merchants -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/drivers ==="
curl -s http://127.0.0.1:3000/api/drivers -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/orders ==="
curl -s http://127.0.0.1:3000/api/orders -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/products ==="
curl -s http://127.0.0.1:3000/api/products -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/coupons ==="
curl -s http://127.0.0.1:3000/api/coupons -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/notifications ==="
curl -s http://127.0.0.1:3000/api/notifications -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/support ==="
curl -s http://127.0.0.1:3000/api/support -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/audit-logs ==="
curl -s http://127.0.0.1:3000/api/audit-logs -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/categories ==="
curl -s http://127.0.0.1:3000/api/categories -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/users ==="
curl -s http://127.0.0.1:3000/api/users -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== /api/plans ==="
curl -s http://127.0.0.1:3000/api/plans -H "Authorization: Bearer $TOKEN" 2>&1 | head -5

echo "=== DONE ==="