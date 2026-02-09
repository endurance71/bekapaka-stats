#!/bin/sh
set -e

# Synchronizacja kodu z wolumenu (zapobieganie E-35 na Macu)
if [ -d "/app_sync" ]; then
  echo "Synchronizacja kodu frontendu z hosta..."
  # Kopiujemy wszystko poza node_modules
  cp -r /app_sync/src /app/ 2>/dev/null || true
  cp -r /app_sync/public /app/ 2>/dev/null || true
  cp /app_sync/index.html /app/ 2>/dev/null || true
  cp /app_sync/package.json /app/ 2>/dev/null || true
  cp /app_sync/vite.config.ts /app/ 2>/dev/null || true
  cp /app_sync/tsconfig.json /app/ 2>/dev/null || true
  cp /app_sync/tailwind.config.ts /app/ 2>/dev/null || true
  cp /app_sync/postcss.config.js /app/ 2>/dev/null || true
fi

# Uruchom serwer
echo "Uruchamianie frontendu..."
exec npm run dev -- --host
