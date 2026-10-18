#!/usr/bin/env bash
# Usuwa stare obrazy BeKaPaKa z VPS po udanym wdrożeniu. Wywoływany z deploy.yml i deploy-cms.yml.
# Usage on VPS: bash scripts/vps/prune-bekapaka-images.sh [--dry-run]
#
# Dotyka wyłącznie repozytoriów ghcr.io/endurance71/bekapaka-stats/<usługa>. W każdym zostają:
#   - obrazy używane przez dowolny kontener na hoście (także zatrzymany) — porównanie po ID obrazu;
#   - najnowszy tag rollbacku z każdej rodziny (rollback-<run_id>, cms-rollback-<run_id>);
#   - w repozytorium bez tagów rollbacku (Studio) najnowszy nieużywany obraz jako poprzednie wydanie.
# Pozostałe tagi są zdejmowane przez `docker rmi <repo>:<tag>` bez -f, więc Docker sam odmówi usunięcia
# obrazu używanego przez kontener albo otagowanego w innym repozytorium. Obrazy innych projektów
# (mthub-*, nix-*, homarr, beszel…) i build cache nie są dotykane.
set -euo pipefail

prefix="${BKPK_IMAGE_PREFIX:-ghcr.io/endurance71/bekapaka-stats}"
services=(backend frontend site studio studio-worker cms)
dry_run=false
case "${1:-}" in
  --dry-run) dry_run=true ;;
  '') ;;
  *) echo "Nieznany argument: $1 (dozwolone: --dry-run)" >&2; exit 2 ;;
esac

# ID obrazów wszystkich kontenerów na hoście; pusty wynik oznacza błąd odczytu, nie pusty serwer.
in_use="$(docker ps -aq | xargs -r docker inspect --format '{{.Image}}')"
if [ -z "$in_use" ]; then
  echo 'Nie odczytano obrazów kontenerów; przerywam czyszczenie.' >&2
  exit 1
fi
declare -A used_ids=()
while read -r id; do used_ids["$id"]=1; done <<< "$in_use"

failures=0
removed=0

prune_repo() {
  local repo="$1" tag id family number newest_id='' newest_created='' created
  local -A keep_ids=() best_number=() best_id=()
  local -a rows=()
  mapfile -t rows < <(docker image ls --no-trunc --format '{{.Tag}} {{.ID}}' "$repo")
  [ "${#rows[@]}" -gt 0 ] || return 0

  for row in "${rows[@]}"; do
    read -r tag id <<< "$row"
    [ -n "${used_ids[$id]:-}" ] && keep_ids["$id"]=1
    if [[ "$tag" =~ ^([a-z-]*rollback)-([0-9]+)$ ]]; then
      family="${BASH_REMATCH[1]}"
      number="${BASH_REMATCH[2]}"
      if [ -z "${best_number[$family]:-}" ] || [ "$number" -gt "${best_number[$family]}" ]; then
        best_number["$family"]="$number"
        best_id["$family"]="$id"
      fi
    fi
  done

  if [ "${#best_id[@]}" -gt 0 ]; then
    for family in "${!best_id[@]}"; do
      keep_ids["${best_id[$family]}"]=1
      echo "$repo: zostaje ${family}-${best_number[$family]}"
    done
  else
    # Brak tagów rollbacku: poprzednim wydaniem jest najnowszy obraz, którego nie używa żaden kontener.
    for row in "${rows[@]}"; do
      read -r tag id <<< "$row"
      [ -z "${keep_ids[$id]:-}" ] || continue
      created="$(docker image inspect --format '{{.Created}}' "$id")"
      if [[ "$created" > "$newest_created" ]]; then
        newest_created="$created"
        newest_id="$id"
      fi
    done
    if [ -n "$newest_id" ]; then
      keep_ids["$newest_id"]=1
      echo "$repo: zostaje poprzednie wydanie ${newest_id:7:12}"
    fi
  fi

  for row in "${rows[@]}"; do
    read -r tag id <<< "$row"
    [ -z "${keep_ids[$id]:-}" ] || continue
    local ref="$repo:$tag"
    # Obraz bez tagu w tym repozytorium (pobrany po digeście) zdejmujemy po ID — bez -f Docker odmówi,
    # jeśli ten sam obraz ma tag w innym repozytorium.
    [ "$tag" != '<none>' ] || ref="$id"
    if [ "$dry_run" = true ]; then
      echo "[dry-run] usunąłbym $ref (${id:7:12})"
    elif docker rmi "$ref" >/dev/null; then
      echo "Usunięto $ref"
      removed=$((removed + 1))
    else
      echo "Nie udało się usunąć $ref" >&2
      failures=$((failures + 1))
    fi
  done
}

for service in "${services[@]}"; do
  prune_repo "$prefix/$service"
done

echo "Czyszczenie obrazów BeKaPaKa: usunięto $removed, błędów $failures."
df -h / | awk 'NR == 2 {print "Dysk /: " $5 " zajęte, wolne " $4}'
[ "$failures" -eq 0 ]
