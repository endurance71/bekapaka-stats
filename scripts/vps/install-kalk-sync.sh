#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/vps/install-kalk-sync.sh" >&2
  exit 1
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
install -m 0755 "$script_dir/kalk-sync.py" /usr/local/bin/bekapaka-kalk-sync
install -m 0644 "$script_dir/bekapaka-kalk-sync.service" /etc/systemd/system/bekapaka-kalk-sync.service
install -m 0644 "$script_dir/bekapaka-kalk-sync.timer" /etc/systemd/system/bekapaka-kalk-sync.timer
systemctl daemon-reload
systemctl enable --now bekapaka-kalk-sync.timer
systemctl list-timers --all bekapaka-kalk-sync.timer
