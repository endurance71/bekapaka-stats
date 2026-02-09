#!/bin/bash
set -e

echo "Oczekiwanie na bazę danych..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL jest gotowy."

# Uruchom Prisma DB push
echo "Synchronizacja schematu bazy danych..."
npx prisma generate
npx prisma db push --skip-generate || true

# Synchronizacja kodu z wolumenu (zapobieganie E-35 na Macu)
if [ -d "/app_sync" ]; then
  echo "Synchronizacja kodu z hosta..."
  cp -r /app_sync/* /app/
fi

# Uruchom serwer
exec npm run start
