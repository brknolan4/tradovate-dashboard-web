#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$PROJECT_DIR/runtime-logs"
HELPER_LOG="$LOG_DIR/sync-helper.log"
APP_LOG="$LOG_DIR/vite.log"
HELPER_PORT="43128"
APP_PORT="5173"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

if ! pgrep -f "node ./sync-helper/server.mjs" >/dev/null 2>&1; then
  echo "Starting Tradovate sync helper..."
  nohup npm run sync-helper >"$HELPER_LOG" 2>&1 &
else
  echo "Tradovate sync helper already running."
fi

if ! pgrep -f "vite --host 127.0.0.1 --port $APP_PORT" >/dev/null 2>&1; then
  echo "Starting dashboard app..."
  nohup npx vite --host 127.0.0.1 --port "$APP_PORT" >"$APP_LOG" 2>&1 &
else
  echo "Dashboard app already running."
fi

echo
echo "Tradovate Dashboard launcher finished."
echo "App URL: http://127.0.0.1:$APP_PORT"
echo "Helper URL: http://127.0.0.1:$HELPER_PORT"
echo "Helper log: $HELPER_LOG"
echo "App log: $APP_LOG"

echo
APP_URL="http://127.0.0.1:$APP_PORT"
(
  sleep 3
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$APP_URL" >/dev/null 2>&1 &
  elif command -v chromium >/dev/null 2>&1; then
    chromium "$APP_URL" >/dev/null 2>&1 &
  elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser "$APP_URL" >/dev/null 2>&1 &
  elif command -v google-chrome >/dev/null 2>&1; then
    google-chrome "$APP_URL" >/dev/null 2>&1 &
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$APP_URL" >/dev/null 2>&1 || true
  fi
) >/dev/null 2>&1 &
