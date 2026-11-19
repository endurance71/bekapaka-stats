#!/usr/bin/env bash
# Instaluje monitor RAM na VPS jako timer systemd (co 5 min).
# Host nie ma demona cron, więc dawny wpis /etc/cron.d nigdy się nie uruchamiał.
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/vps/install-ram-monitor.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="/usr/local/bin/bekapaka-ram-monitor"
LEGACY_CRON_FILE="/etc/cron.d/bekapaka-ram-monitor"

install -m 755 "$SCRIPT_DIR/ram-monitor.sh" "$TARGET"
install -m 644 "$SCRIPT_DIR/bekapaka-ram-monitor.service" /etc/systemd/system/bekapaka-ram-monitor.service
install -m 644 "$SCRIPT_DIR/bekapaka-ram-monitor.timer" /etc/systemd/system/bekapaka-ram-monitor.timer

# Stary wpis cron: przy doinstalowaniu crona pomiar szedłby podwójnie.
rm -f "$LEGACY_CRON_FILE"

touch /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
chown root:root /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
chmod 644 /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
if [[ -f "$SCRIPT_DIR/bekapaka-ram.logrotate" ]]; then
  install -m 644 "$SCRIPT_DIR/bekapaka-ram.logrotate" /etc/logrotate.d/bekapaka-ram
fi

systemctl daemon-reload
systemctl enable --now bekapaka-ram-monitor.timer
# Pierwszy pomiar od razu, tą samą drogą co timer.
systemctl start bekapaka-ram-monitor.service

echo "Zainstalowano: $TARGET"
systemctl list-timers --all bekapaka-ram-monitor.timer --no-pager
echo "--- Ostatni wpis logu ---"
tail -1 /var/log/bekapaka-ram.log
