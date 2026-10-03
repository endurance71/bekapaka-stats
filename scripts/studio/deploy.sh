#!/usr/bin/env bash
# Run locally/on VPS only after reading the VPS runbooks.
# Usage on VPS: scripts/studio/deploy.sh <40-character release SHA>
set -euo pipefail
studio_sha="${1:-}"
if [[ ! "$studio_sha" =~ ^[a-f0-9]{40}$ ]]; then echo 'Podaj pełne SHA zatwierdzonego wydania.' >&2; exit 1; fi
cd /opt/bekapaka-stats
if ! getent hosts studio.bekapaka.pl >/dev/null; then echo 'Brak DNS Studio.' >&2; exit 1; fi
# The backend of this exact release must already have run additive Studio migrations.
if [ "$(docker inspect --format '{{.Config.Image}}' bkpk-backend-prod)" != "ghcr.io/endurance71/bekapaka-stats/backend:$studio_sha" ]; then echo 'Najpierw wdroż backend z tego samego SHA.' >&2; exit 1; fi
docker exec bkpk-backend-prod node --input-type=module -e 'if (!process.env.STUDIO_OWNER_ID) process.exit(1); const {prisma}=await import("./lib/prisma.js"); const owner=await prisma.rosterPlayer.findUnique({where:{id:process.env.STUDIO_OWNER_ID},select:{password:true}}); if (!owner?.password) process.exit(1); await prisma.studioProject.count(); await prisma.$disconnect(); process.exit(0);'
docker exec bkpk-backend-prod node studio/import-backgrounds.js
if ss -ltn | awk '{print $4}' | grep -q ':8083$' && ! docker inspect bkpk-studio-prod >/dev/null 2>&1; then echo 'Port 8083 jest zajęty.' >&2; exit 1; fi
# Both images write as UID 0; the worker drops DAC override capabilities.
# Its private mount must therefore be owned by UID 0 as well.
sudo install -d -m 700 -o 0 -g 0 data/studio
# Explicit two-service update. No other project/network/service is modified here.
export BKPK_STUDIO_IMAGE_TAG="$studio_sha"
docker compose -f docker-compose.prod.yml --profile studio config --quiet
docker compose -f docker-compose.prod.yml --profile studio pull bkpk-studio bkpk-studio-worker
docker compose -f docker-compose.prod.yml --profile studio up -d --no-deps bkpk-studio bkpk-studio-worker
curl --fail --retry 15 --retry-delay 2 --retry-connrefused http://127.0.0.1:8083/healthz
for studio_attempt in $(seq 1 30); do
 if [ "$(docker inspect --format '{{.State.Health.Status}}' bkpk-studio-worker-prod)" = healthy ]; then exit 0; fi
 sleep 2
done
echo 'Worker nie przeszedł kontroli zdrowia. Sprawdź docker logs bkpk-studio-worker-prod.' >&2
exit 1
