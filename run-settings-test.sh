#!/bin/bash
cd /home/z/my-project

if ! ss -tlnp | grep -q 3000; then
  NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
  sleep 2
fi

echo "=== Navigate to Settings ==="
agent-browser open http://127.0.0.1:3000 2>&1
sleep 3
agent-browser find text "Paramètres" click 2>&1
sleep 2

echo "=== Settings Général tab content ==="
agent-browser snapshot -s "main" 2>&1

echo "=== Click Commissions tab ==="
agent-browser find text "Commissions" click 2>&1
sleep 2
agent-browser snapshot -s "main" 2>&1

echo "=== Check Settings API ==="
TOKEN=$(agent-browser eval "JSON.parse(localStorage.getItem('rapigo-auth')).state.token" 2>&1 | tr -d '"')
curl -s "http://127.0.0.1:3000/api/settings" -H "Authorization: Bearer $TOKEN" 2>&1

echo ""
echo "=== Test Notifications page (sidebar) ==="
agent-browser find text "Notifications" click 2>&1
sleep 2
agent-browser snapshot -c 2>&1

echo "=== DONE ==="