#!/bin/bash
# Deep dive into specific pages
cd /home/z/my-project

if ! ss -tlnp | grep -q 3000; then
  NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
  sleep 2
fi

# Keep alive
(while ss -tlnp | grep -q 3000; do sleep 3; done) &

echo "=== OPEN ADMIN ==="
agent-browser open http://127.0.0.1:3000 2>&1
sleep 3

echo "=== DASHBOARD DETAILED ==="
agent-browser find text "Tableau de bord" click 2>&1
sleep 3
echo "--- Full page content ---"
agent-browser snapshot 2>&1

echo "=== SETTINGS DETAILED ==="
agent-browser find text "Paramètres" click 2>&1
sleep 2
agent-browser snapshot 2>&1

echo "=== SETTINGS TABS ==="
# Click Commissions tab
agent-browser find text "Commissions" click 2>&1
sleep 2
agent-browser snapshot -c 2>&1

echo "=== SETTINGS DELIVERY TAB ==="
agent-browser find text "Livraison" click 2>&1
sleep 2
agent-browser snapshot -c 2>&1

echo "=== CLICK NOTIFICATIONS IN SIDEBAR ==="
agent-browser find text "Notifications" click 2>&1
sleep 2
agent-browser snapshot -c 2>&1

echo "=== SCROLL DOWN ON DASHBOARD ==="
agent-browser find text "Tableau de bord" click 2>&1
sleep 2
agent-browser scroll down 500 2>&1
agent-browser snapshot -c 2>&1

echo "=== GET ALL TEXT ON DASHBOARD ==="
agent-browser eval "document.querySelector('main')?.innerText?.substring(0, 2000) || 'NO MAIN ELEMENT'" 2>&1

echo "=== CHECK IF STATS API FAILS ==="
# Get the auth token from localStorage
agent-browser eval "localStorage.getItem('rapigo-auth')" 2>&1 | head -5

echo "=== DONE ==="