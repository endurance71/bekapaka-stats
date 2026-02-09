#!/usr/bin/env sh
set -e

until python3 - <<'PY' >/dev/null 2>&1
import socket
import sys

try:
    with socket.create_connection(('db', 5432), timeout=1):
        pass
except Exception:
    sys.exit(1)
sys.exit(0)
PY
do
  echo "Oczekiwanie na bazę danych..."
  sleep 1
done

echo "PostgreSQL jest gotowy."
