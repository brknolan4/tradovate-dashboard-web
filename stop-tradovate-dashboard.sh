#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/brendan/AI-Shared/AntigravityProjects/tradovate dashbaord"
LOG_DIR="$PROJECT_DIR/runtime-logs"
HELPER_PID_FILE="$LOG_DIR/sync-helper.pid"
APP_PID_FILE="$LOG_DIR/vite.pid"

if [ -f "$HELPER_PID_FILE" ]; then
  kill "$(cat "$HELPER_PID_FILE")" >/dev/null 2>&1 || true
  rm -f "$HELPER_PID_FILE"
fi

if [ -f "$APP_PID_FILE" ]; then
  kill "$(cat "$APP_PID_FILE")" >/dev/null 2>&1 || true
  rm -f "$APP_PID_FILE"
fi

pkill -f "/home/brendan/AI-Shared/AntigravityProjects/tradovate dashbaord/.*sync-helper/server.mjs" >/dev/null 2>&1 || true
pkill -f "/home/brendan/AI-Shared/AntigravityProjects/tradovate dashbaord/node_modules/.*/vite" >/dev/null 2>&1 || true
pkill -f "127.0.0.1:5173" >/dev/null 2>&1 || true
pkill -f "127.0.0.1:43128" >/dev/null 2>&1 || true

if command -v fuser >/dev/null 2>&1; then
  fuser -k 5173/tcp >/dev/null 2>&1 || true
  fuser -k 43128/tcp >/dev/null 2>&1 || true
fi

echo "Stopped Tradovate dashboard app and sync helper (if running)."
