#!/usr/bin/env bash
# Instaluje monitor RAM na VPS (cron co 5 min).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="/usr/local/bin/bekapaka-ram-monitor"
CRON_FILE="/etc/cron.d/bekapaka-ram-monitor"

install -m 755 "$SCRIPT_DIR/ram-monitor.sh" "$TARGET"

cat >"$CRON_FILE" <<'EOF'
# BeKaPaKa — monitor RAM (co 5 min, log + syslog przy progach)
*/5 * * * * root /usr/local/bin/bekapaka-ram-monitor
EOF
chmod 644 "$CRON_FILE"

touch /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
chown root:root /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
chmod 644 /var/log/bekapaka-ram.log /var/log/bekapaka-ram-alerts.log
if [[ -f "$SCRIPT_DIR/bekapaka-ram.logrotate" ]]; then
  install -m 644 "$SCRIPT_DIR/bekapaka-ram.logrotate" /etc/logrotate.d/bekapaka-ram
fi

echo "Zainstalowano: $TARGET"
echo "Cron: $CRON_FILE"
"$TARGET"
echo "--- Ostatni wpis logu ---"
tail -3 /var/log/bekapaka-ram.log
