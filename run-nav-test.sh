#!/bin/bash
# Ensure server is running
cd /home/z/my-project
if ! ss -tlnp | grep -q 3000; then
  NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
  SERVER_PID=$!
  sleep 2
  echo "RESTARTED SERVER PID=$SERVER_PID"
else
  echo "SERVER ALREADY RUNNING"
fi

# Keep alive
(while ss -tlnp | grep -q 3000; do sleep 3; done; echo "SERVER_DIED") &

# Navigate to admin - we should already be logged in from localStorage
echo "=== NAVIGATING TO ADMIN ==="
agent-browser open http://127.0.0.1:3000 2>&1
sleep 3
agent-browser get url 2>&1
agent-browser snapshot -c 2>&1

# Take full dashboard screenshot
echo "=== DASHBOARD FULL ==="
agent-browser screenshot /home/z/my-project/test-dash-full.png --full 2>&1
agent-browser snapshot -i 2>&1

# Click on each navigation item and take screenshot
echo "=== TESTING NAVIGATION ==="

echo "--- Users ---"
agent-browser find text "Utilisateurs" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-users.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Merchants ---"
agent-browser find text "Commerçants" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-merchants.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Drivers ---"
agent-browser find text "Livreurs" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-drivers.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Orders ---"
agent-browser find text "Commandes" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-orders.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Categories ---"
agent-browser find text "Catégories" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-categories.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Products ---"
agent-browser find text "Produits" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-products.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Coupons ---"
agent-browser find text "Coupons" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-coupons.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Subscriptions ---"
agent-browser find text "Abonnements" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-subscriptions.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Settings ---"
agent-browser find text "Paramètres" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-settings.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Support ---"
agent-browser find text "Support" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-support.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Audit Logs ---"
agent-browser find text "Journaux d'audit" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-audit.png 2>&1
agent-browser snapshot -c 2>&1

echo "--- Cities ---"
agent-browser find text "Villes" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-cities.png 2>&1
agent-browser snapshot -c 2>&1

# Go back to dashboard
echo "--- Dashboard ---"
agent-browser find text "Tableau de bord" click 2>&1
sleep 2
agent-browser screenshot /home/z/my-project/test-dashboard-final.png 2>&1

# Check for any errors
echo "=== ERRORS ==="
agent-browser errors 2>&1
agent-browser console 2>&1 | tail -20

echo "=== ALL NAVIGATION TESTS COMPLETE ==="