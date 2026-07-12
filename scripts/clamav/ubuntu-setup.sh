#!/usr/bin/env bash
#
# ubuntu-setup.sh — install + configure ClamAV and the Trustalo scan tooling on
# Ubuntu 20.04+ (and Debian). Idempotent: safe to re-run.
#
# It installs clamav-daemon + clamav-freshclam, drops the scan wrapper and the
# VirusEvent hook into /usr/local/bin, wires the hook into clamd.conf, creates
# the world-readable state dir the Trustalo agent tails, primes the signature
# database on a fresh install, and installs + enables the scan timer.
#
# Run as root:  sudo ./ubuntu-setup.sh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

STATE_DIR="/var/lib/trustalo/av/clamav"
CLAMD_CONF="/etc/clamav/clamd.conf"
BIN_DIR="/usr/local/bin"
HOOK_PATH="$BIN_DIR/trustalo-virus-event.sh"
WRAPPER_PATH="$BIN_DIR/trustalo-clamav-scan.sh"

if [ "$(id -u)" -ne 0 ]; then
  echo "ubuntu-setup.sh must run as root (try: sudo $0)" >&2
  exit 1
fi

# ---- helpers ----------------------------------------------------------------

# ensure_directive rewrites $file so that `$key $value` is the single active
# setting for $key: it strips every existing active/commented occurrence and
# appends the desired one. Portable (grep + printf only) and idempotent.
ensure_directive() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  grep -vE "^[[:space:]]*#?[[:space:]]*${key}([[:space:]]|\$)" "$file" >"$tmp" || true
  printf '%s %s\n' "$key" "$value" >>"$tmp"
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

warn_low_ram() {
  local mem_kb
  mem_kb="$(awk '/^MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  if [ "${mem_kb:-0}" -gt 0 ] && [ "$mem_kb" -lt 2097152 ]; then
    echo "WARNING: total RAM is < 2 GB. clamd loads the full signature set and" >&2
    echo "         typically needs ~1-1.5 GB resident; it may fail to start or" >&2
    echo "         be OOM-killed on this host." >&2
  fi
}

# ---- go ---------------------------------------------------------------------
warn_low_ram

echo "==> Installing ClamAV packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y clamav clamav-daemon clamav-freshclam

# clamd's runtime user (Debian default: clamav). Own the state dir by it so the
# realtime VirusEvent hook can append; root's scheduled scan chowns back to it.
daemon_user="clamav"
if [ -f "$CLAMD_CONF" ]; then
  configured_user="$(awk '/^[[:space:]]*User[[:space:]]/ {print $2; exit}' "$CLAMD_CONF" || true)"
  if [ -n "$configured_user" ]; then
    daemon_user="$configured_user"
  fi
fi
daemon_group="$daemon_user"
if ! id "$daemon_user" >/dev/null 2>&1; then
  daemon_user="root"
  daemon_group="root"
fi

echo "==> Creating state dir $STATE_DIR (owner ${daemon_user}:${daemon_group}, 0755)"
mkdir -p "$STATE_DIR"
# Make the whole /var/lib/trustalo chain traversable + readable for the agent.
chmod 0755 /var/lib/trustalo /var/lib/trustalo/av "$STATE_DIR"
chown "${daemon_user}:${daemon_group}" "$STATE_DIR"

echo "==> Installing scan wrapper + VirusEvent hook into $BIN_DIR"
install -m 0755 "$script_dir/trustalo-clamav-scan.sh" "$WRAPPER_PATH"
install -m 0755 "$script_dir/trustalo-virus-event.sh" "$HOOK_PATH"

echo "==> Wiring VirusEvent into $CLAMD_CONF"
ensure_directive "$CLAMD_CONF" "VirusEvent" "$HOOK_PATH"

# ---- signature database -----------------------------------------------------
# clamd refuses to start without a database. On a fresh install the DB may be
# empty, so run freshclam once (stopping the updater first to release its lock).
if ! ls /var/lib/clamav/daily.cvd /var/lib/clamav/daily.cld >/dev/null 2>&1; then
  echo "==> No signature DB yet; priming with freshclam"
  systemctl stop clamav-freshclam 2>/dev/null || true
  freshclam || echo "WARNING: initial freshclam failed; clamav-daemon may not start until it succeeds" >&2
fi

echo "==> Enabling clamav-freshclam + clamav-daemon"
systemctl enable --now clamav-freshclam
systemctl enable --now clamav-daemon

# ---- scheduled scan timer ---------------------------------------------------
echo "==> Installing systemd scan service + timer"
install -m 0644 "$script_dir/systemd/trustalo-clamav-scan.service" \
  /etc/systemd/system/trustalo-clamav-scan.service
install -m 0644 "$script_dir/systemd/trustalo-clamav-scan.timer" \
  /etc/systemd/system/trustalo-clamav-scan.timer
systemctl daemon-reload
systemctl enable --now trustalo-clamav-scan.timer

echo
echo "Done. Verify with:"
echo "  clamdscan --ping 3          # daemon reachable"
echo "  systemctl status clamav-daemon trustalo-clamav-scan.timer"
echo "  sudo $WRAPPER_PATH          # run a scan now; then cat $STATE_DIR/last-scan.json"
