#!/bin/sh
# Docker entrypoint script for retro-ipcam-webadmin
# Runs both Caddy (frontend) and Node.js (proxy server)

set -e

echo "🚀 Starting Retro IP Camera Web Admin..."
echo "   Frontend: http://localhost:80"
echo "   Proxy:    http://localhost:3001"

# Start Caddy in background
echo "📡 Starting Caddy web server..."
caddy run --config /etc/caddy/Caddyfile &
CADDY_PID=$!

# Wait a moment for Caddy to start
sleep 2

# Start Node.js proxy server in foreground
echo "🔄 Starting CORS proxy server..."
cd /app
exec node proxy-server.mjs

# If proxy exits, also stop Caddy
kill $CADDY_PID 2>/dev/null || true
