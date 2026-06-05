#!/bin/sh
set -e

# Synchronizacja kodu z wolumenu (zapobieganie E-35 na Macu)
if [ -d "/app_sync" ]; then
  echo "Synchronizacja kodu frontendu z hosta..."
  rm -rf /app/src
  cp -r /app_sync/src /app/src
  cp -r /app_sync/public /app/public 2>/dev/null || true
  cp /app_sync/index.html /app/index.html 2>/dev/null || true
  cp /app_sync/package.json /app/package.json 2>/dev/null || true
  cp /app_sync/vite.config.ts /app/vite.config.ts 2>/dev/null || true
  cp /app_sync/tsconfig.json /app/tsconfig.json 2>/dev/null || true
  cp /app_sync/tailwind.config.ts /app/tailwind.config.ts 2>/dev/null || true
  cp /app_sync/postcss.config.js /app/postcss.config.js 2>/dev/null || true
fi

# Uruchom serwer
echo "Uruchamianie frontendu..."
exec npm run dev -- --host
