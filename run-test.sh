#!/bin/bash
# Start the server
cd /home/z/my-project
pkill -f "server.js" 2>/dev/null
pkill -f "next" 2>/dev/null
sleep 1
NODE_ENV=production node .next/standalone/server.js &>/tmp/next.log &
SERVER_PID=$!
sleep 2

# Verify server is running
if ! ss -tlnp | grep -q 3000; then
  echo "FATAL: Server failed to start"
  exit 1
fi
echo "SERVER_STARTED PID=$SERVER_PID"

# Function to keep server alive
keep_alive() {
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 2
  done
  echo "SERVER_DIED"
}
keep_alive &

# === STEP 1: Landing page ===
echo "=== STEP 1: Landing page ==="
agent-browser open http://127.0.0.1:3000 2>&1
echo "TITLE:"
agent-browser get title 2>&1
agent-browser screenshot /home/z/my-project/test-landing.png 2>&1

echo "=== LANDING SNAPSHOT ==="
agent-browser snapshot -i 2>&1

# === STEP 2: Login ===
echo "=== STEP 2: Login ==="
# Find and click Connexion
agent-browser find text "Connexion" click 2>&1
sleep 1
agent-browser snapshot -i 2>&1

# Fill credentials
agent-browser find label "Email" fill "diarramoussaka7@gmail.com" 2>&1
agent-browser find label "Mot de passe" fill "pispa2026" 2>&1

# Submit form
agent-browser eval "document.querySelector('form').requestSubmit()" 2>&1
sleep 5

echo "=== AFTER LOGIN ==="
echo "URL:"
agent-browser get url 2>&1
agent-browser screenshot /home/z/my-project/test-after-login.png 2>&1
agent-browser snapshot -i 2>&1

# === STEP 3: Admin dashboard ===
echo "=== STEP 3: Admin dashboard exploration ==="
agent-browser screenshot /home/z/my-project/test-admin.png --full 2>&1
agent-browser snapshot -i 2>&1

# Check for errors
echo "=== CONSOLE ERRORS ==="
agent-browser errors 2>&1

echo "=== TEST COMPLETE ==="