#!/usr/bin/env bash
# BeKaPaKa VPS — bezpieczna optymalizacja (bez MOYA down/prune globalnego).
# Uruchom na hoście: sudo bash scripts/vps/vps-optimize.sh
set -euo pipefail

SWAP_SIZE="${BKP_SWAP_SIZE:-2G}"
SWAPPINESS="${BKP_SWAPPINESS:-10}"
JOURNAL_MAX="${BKP_JOURNAL_MAX:-200M}"

echo "=== BeKaPaKa VPS optimize — $(date -u -Iseconds) ==="

echo "--- Przed ---"
free -h
df -h / | tail -1
docker system df 2>/dev/null || true

if [[ ! -f /swapfile ]] && [[ ! -f /swap.img ]]; then
  echo "--- Swap ${SWAP_SIZE} ---"
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' >>/etc/fstab
  fi
  sysctl -w vm.swappiness="$SWAPPINESS"
  if ! grep -q '^vm.swappiness' /etc/sysctl.d/99-bekapaka.conf 2>/dev/null; then
    echo "vm.swappiness=${SWAPPINESS}" >/etc/sysctl.d/99-bekapaka.conf
  fi
  echo "Swap aktywny."
else
  echo "--- Swap już istnieje, pomijam ---"
  swapon --show 2>/dev/null || true
fi

echo "--- Docker build cache ---"
docker builder prune -af 2>/dev/null || true

echo "--- Nieużywane obrazy Docker (bez kontenerów w użyciu) ---"
docker image prune -a -f 2>/dev/null || true

echo "--- Journal ---"
journalctl --vacuum-size="$JOURNAL_MAX" 2>/dev/null || true

echo "--- APT cache ---"
apt-get clean -y 2>/dev/null || true

if [[ -d /home/debian/.npm/_cacache ]]; then
  echo "--- npm cache (debian) ---"
  sudo -u debian npm cache clean --force 2>/dev/null || true
fi

echo "--- Po ---"
free -h
df -h / | tail -1
docker system df 2>/dev/null || true
echo "=== Gotowe ==="
