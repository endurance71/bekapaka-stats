#!/usr/bin/env bash
# Usuwa stare obrazy BeKaPaKa z VPS po udanym wdrożeniu.
# VPS jest współdzielony: dotykamy wyłącznie repozytoriów ghcr.io/<owner/repo>/*,
# bo globalny `docker image prune -a` usuwałby obrazy innych projektów.
# Zostają: obrazy używane przez dowolny kontener (także zatrzymany)
# oraz KEEP_ROLLBACKS najnowszych tagów rollback-* / cms-rollback-* na usługę.
# Usage on VPS: scripts/vps/prune-images.sh <owner/repo>   (DRY_RUN=1 tylko wypisuje)
set -euo pipefail
repository="${1:?Podaj owner/repo, np. endurance71/bekapaka-stats}"
keep_rollbacks="${KEEP_ROLLBACKS:-2}"
dry_run="${DRY_RUN:-0}"
prefix="ghcr.io/${repository}/"

in_use="$(docker ps -aq | xargs -r docker inspect --format '{{.Image}}' | sort -u)"

remove() {
  if [ "$dry_run" = 1 ]; then
    echo "[dry-run] docker rmi $1"
  else
    docker rmi "$1" >/dev/null && echo "Usunięto $1" || echo "Nie udało się usunąć $1" >&2
  fi
}

repos="$(docker image ls --format '{{.Repository}}' | grep -F "$prefix" | sort -u || true)"
for repo in $repos; do
  # Tagi rollbacku kończą się numerem przebiegu GitHub Actions — najnowsze mają największy numer.
  keep_tags="$(docker image ls "$repo" --format '{{.Tag}}' \
    | grep -E '(^|-)rollback-[0-9]+$' \
    | awk -F- '{print $NF "\t" $0}' | sort -rn | cut -f2 | head -n "$keep_rollbacks" || true)"

  for tag in $(docker image ls "$repo" --format '{{.Tag}}' | grep -vx '<none>' || true); do
    grep -qxF "$tag" <<<"$keep_tags" && continue
    id="$(docker image inspect --format '{{.Id}}' "$repo:$tag")"
    grep -qxF "$id" <<<"$in_use" && continue
    remove "$repo:$tag"
  done

  # Obrazy bez tagu, które zostały po nadpisaniu tagu przy `docker pull`.
  for id in $(docker image ls "$repo" --filter dangling=true --format '{{.ID}}' --no-trunc); do
    grep -qxF "$id" <<<"$in_use" && continue
    remove "$id"
  done
done
