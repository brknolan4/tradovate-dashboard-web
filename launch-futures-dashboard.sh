#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$PROJECT_DIR/runtime-logs"
HELPER_LOG="$LOG_DIR/sync-helper.log"
APP_LOG="$LOG_DIR/vite.log"
APP_PORT="5173"
APP_URL="http://127.0.0.1:$APP_PORT"
HELPER_PID_FILE="$LOG_DIR/sync-helper.pid"
APP_PID_FILE="$LOG_DIR/vite.pid"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"

cleanup() {
  if [ -f "$HELPER_PID_FILE" ]; then
    kill "$(cat "$HELPER_PID_FILE")" >/dev/null 2>&1 || true
    rm -f "$HELPER_PID_FILE"
  fi
  if [ -f "$APP_PID_FILE" ]; then
    kill "$(cat "$APP_PID_FILE")" >/dev/null 2>&1 || true
    rm -f "$APP_PID_FILE"
  fi
}

# Start fresh so ports do not drift and stale background processes do not hijack the launcher.
pkill -f "$PROJECT_DIR/.*sync-helper/server.mjs" >/dev/null 2>&1 || true
pkill -f "$PROJECT_DIR/node_modules/.*/vite" >/dev/null 2>&1 || true
rm -f "$HELPER_PID_FILE" "$APP_PID_FILE"

if command -v fuser >/dev/null 2>&1; then
  fuser -k 5173/tcp >/dev/null 2>&1 || true
  fuser -k 43128/tcp >/dev/null 2>&1 || true
fi

if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

echo "Starting sync helper..."
nohup npm run sync-helper >"$HELPER_LOG" 2>&1 &
echo $! > "$HELPER_PID_FILE"

echo "Starting dashboard app..."
nohup npx vite --host 127.0.0.1 --port "$APP_PORT" --strictPort >"$APP_LOG" 2>&1 &
echo $! > "$APP_PID_FILE"

APP_READY=0
for _ in $(seq 1 30); do
  if command -v curl >/dev/null 2>&1; then
    if curl -fsS "$APP_URL" >/dev/null 2>&1; then
      APP_READY=1
      break
    fi
  else
    sleep 1
    APP_READY=1
    break
  fi
  sleep 1
done

if [ "$APP_READY" -ne 1 ]; then
  echo "Dashboard did not become ready at $APP_URL in time."
  echo "Check logs: $APP_LOG"
  exit 1
fi

BROWSER_PID=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$APP_URL" >/dev/null 2>&1 &
  BROWSER_PID=$!
elif command -v chromium >/dev/null 2>&1; then
  chromium --new-window "$APP_URL" >/dev/null 2>&1 &
  BROWSER_PID=$!
elif command -v chromium-browser >/dev/null 2>&1; then
  chromium-browser --new-window "$APP_URL" >/dev/null 2>&1 &
  BROWSER_PID=$!
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome --new-window "$APP_URL" >/dev/null 2>&1 &
  BROWSER_PID=$!
else
  echo "Could not find Chromium/Chrome. Opening fallback browser."
  xdg-open "$APP_URL" >/dev/null 2>&1 || true
  echo "Fallback browser used; app will keep running until manually stopped."
  exit 0
fi

echo "Futures Dashboard launched in app window."
echo "Closing that window should stop the dashboard helper stack started by this launcher."

wait "$BROWSER_PID" || true
cleanup
