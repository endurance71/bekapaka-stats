#!/usr/bin/env bash
# BeKaPaKa VPS — monitor zużycia RAM (host + Docker + top procesy).
# Instalacja: docs/vps-runbook.md#monitorowanie-ram
set -euo pipefail

LOG_FILE="${BKP_RAM_LOG:-/var/log/bekapaka-ram.log}"
ALERT_LOG="${BKP_RAM_ALERT_LOG:-/var/log/bekapaka-ram-alerts.log}"
WARN_AVAIL_MIB="${BKP_RAM_WARN_AVAIL_MIB:-1024}"
CRIT_AVAIL_MIB="${BKP_RAM_CRIT_AVAIL_MIB:-512}"
WARN_USED_PCT="${BKP_RAM_WARN_USED_PCT:-85}"
CRIT_USED_PCT="${BKP_RAM_CRIT_USED_PCT:-92}"

timestamp() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

read_mem_kb() {
  awk '
    /^MemTotal:/ { total=$2 }
    /^MemAvailable:/ { avail=$2 }
    /^MemFree:/ { free=$2 }
    /^Buffers:/ { buffers=$2 }
    /^Cached:/ { cached=$2 }
    END {
      if (avail == "") avail = free + buffers + cached
      print total, avail
    }
  ' /proc/meminfo
}

log_line() {
  echo "$1" >>"$LOG_FILE"
}

maybe_alert() {
  local level="$1"
  local msg="$2"
  echo "[$(timestamp)] [$level] $msg" >>"$ALERT_LOG"
  logger -t bekapaka-ram -p "user.${level}" "$msg" 2>/dev/null || true
}

main() {
  local total_kb avail_kb used_kb used_pct avail_mib
  read -r total_kb avail_kb < <(read_mem_kb)
  used_kb=$((total_kb - avail_kb))
  used_pct=$((used_kb * 100 / total_kb))
  avail_mib=$((avail_kb / 1024))

  local swap_total swap_used
  swap_total=$(awk '/^SwapTotal:/ { print $2 }' /proc/meminfo)
  swap_used=$(awk '/^SwapTotal:/ { t=$2 } /^SwapFree:/ { f=$2 } END { print t-f }' /proc/meminfo)
  local swap_mib=0
  if [[ "${swap_total:-0}" -gt 0 ]]; then
    swap_mib=$((swap_used / 1024))
  fi

  local load
  load=$(awk '{ print $1","$2","$3 }' /proc/loadavg)

  local docker_mem=''
  if command -v docker >/dev/null 2>&1; then
    docker_mem=$(docker stats --no-stream --format '{{.Name}} mem={{.MemUsage}} cpu={{.CPUPerc}}' 2>/dev/null | tr '\n' ';' || true)
  fi

  local top_rss
  top_rss=$(ps -eo rss,comm --sort=-rss 2>/dev/null | awk 'NR<=6 { printf "%s:%.0fMiB ", $2, $1/1024 }' || true)

  log_line "[$(timestamp)] avail=${avail_mib}MiB used=${used_pct}% swap_used=${swap_mib}MiB load=${load} docker=${docker_mem} top=${top_rss}"

  if [[ "$avail_mib" -le "$CRIT_AVAIL_MIB" ]] || [[ "$used_pct" -ge "$CRIT_USED_PCT" ]]; then
    maybe_alert "err" "RAM CRITICAL: available=${avail_mib}MiB used=${used_pct}% swap=${swap_mib}MiB load=${load}"
  elif [[ "$avail_mib" -le "$WARN_AVAIL_MIB" ]] || [[ "$used_pct" -ge "$WARN_USED_PCT" ]]; then
    maybe_alert "warning" "RAM WARN: available=${avail_mib}MiB used=${used_pct}% swap=${swap_mib}MiB load=${load}"
  fi
}

umask 022
mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$ALERT_LOG")"
touch "$LOG_FILE" "$ALERT_LOG" 2>/dev/null || true
main
