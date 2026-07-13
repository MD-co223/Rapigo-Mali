#!/bin/bash
cd /home/z/my-project
while [ -f /tmp/keep-server-alive ]; do
  npx next dev -p 3000 2>&1
  sleep 2
done