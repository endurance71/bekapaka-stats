#!/usr/bin/env bash
# Run on the BeKaPaKa host; never reads or operates on MOYA.
set -euo pipefail
umask 077
studio_root="${STUDIO_DEPLOY_DIR:-/opt/bekapaka-stats}"
studio_backup="${STUDIO_BACKUP_DIR:-/opt/backups/bekapaka-studio}"
mkdir -p "$studio_backup"
studio_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
studio_target="$studio_backup/$studio_stamp"
mkdir "$studio_target"
cd "$studio_root"
# Quiesce only the writer of render/AI assets to keep DB and private files coherent.
worker_running="$(docker inspect --format '{{.State.Running}}' bkpk-studio-worker-prod 2>/dev/null || true)"
if [ "$worker_running" = true ]; then docker stop --time 180 bkpk-studio-worker-prod >/dev/null; fi
trap 'if [ "$worker_running" = true ]; then docker start bkpk-studio-worker-prod >/dev/null; fi' EXIT
# Uploads in the API may still occur. Back up immutable assets twice around the DB snapshot.
mkdir -p "$studio_target/files"
rsync -a --exclude jobs/ --exclude .worker-health data/studio/ "$studio_target/files/"
docker exec bkpk-db-prod pg_dump -U bekapaka -d bekapaka_stats -Fc > "$studio_target/database.dump"
rsync -a --exclude jobs/ --exclude .worker-health data/studio/ "$studio_target/files/"
docker cp bkpk-studio-worker-prod:/app/studio/brand/manifest.json "$studio_target/brand-manifest.json" >/dev/null
(cd "$studio_target" && shasum -a 256 database.dump brand-manifest.json > SHA256SUMS)
# Keep at least the last 35 days. Do not remove project/source assets.
find "$studio_backup" -mindepth 1 -maxdepth 1 -type d -mtime +35 -exec rm -rf -- {} +
