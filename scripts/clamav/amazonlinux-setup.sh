#!/usr/bin/env bash
#
# amazonlinux-setup.sh — install + configure ClamAV and the Trustalo scan
# tooling on Amazon Linux 2023 (x86_64 and arm64/Graviton). Idempotent.
#
# It installs clamav + clamd + clamav-update, configures /etc/clamd.d/scan.conf
# (socket, VirusEvent, drops the Example guard line), flips the SELinux boolean
# that lets clamd read the whole filesystem, primes the signature DB, enables
# clamd@scan plus signature updates, and installs the scan timer.
#
# Run as root:  sudo ./amazonlinux-setup.sh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

STATE_DIR="/var/lib/trustalo/av/clamav"
SCAN_CONF="/etc/clamd.d/scan.conf"
FRESHCLAM_CONF="/etc/freshclam.conf"
BIN_DIR="/usr/local/bin"
HOOK_PATH="$BIN_DIR/trustalo-virus-event.sh"
WRAPPER_PATH="$BIN_DIR/trustalo-clamav-scan.sh"

if [ "$(id -u)" -ne 0 ]; then
  echo "amazonlinux-setup.sh must run as root (try: sudo $0)" >&2
  exit 1
fi

# ---- helpers ----------------------------------------------------------------

# ensure_directive rewrites $file so that `$key $value` is the single active
# setting for $key (strips active + commented occurrences, appends ours).
ensure_directive() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  grep -vE "^[[:space:]]*#?[[:space:]]*${key}([[:space:]]|\$)" "$file" >"$tmp" || true
  printf '%s %s\n' "$key" "$value" >>"$tmp"
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

# drop_example comments out the bare `Example` guard line that ships enabled in
# the sample configs; clamd/freshclam refuse to run until it is gone.
drop_example() {
  local file="$1" tmp
  [ -f "$file" ] || return 0
  tmp="$(mktemp)"
  grep -vE '^[[:space:]]*Example[[:space:]]*$' "$file" >"$tmp" || true
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

warn_low_ram() {
  local mem_kb
  mem_kb="$(awk '/^MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  if [ "${mem_kb:-0}" -gt 0 ] && [ "$mem_kb" -lt 2097152 ]; then
    echo "WARNING: total RAM is < 2 GB. clamd typically needs ~1-1.5 GB resident;" >&2
    echo "         a t3.micro/t4g.micro may OOM-kill it. Prefer *.small or larger." >&2
  fi
}

# ---- go ---------------------------------------------------------------------
warn_low_ram

echo "==> Installing ClamAV packages"
dnf install -y clamav clamd clamav-update

# clamd@scan runs as this user (scan.conf default: clamscan). Own the state dir
# by it so the realtime VirusEvent hook can append.
daemon_user="clamscan"
if [ -f "$SCAN_CONF" ]; then
  configured_user="$(awk '/^[[:space:]]*User[[:space:]]/ {print $2; exit}' "$SCAN_CONF" || true)"
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
chmod 0755 /var/lib/trustalo /var/lib/trustalo/av "$STATE_DIR"
chown "${daemon_user}:${daemon_group}" "$STATE_DIR"

echo "==> Installing scan wrapper + VirusEvent hook into $BIN_DIR"
install -m 0755 "$script_dir/trustalo-clamav-scan.sh" "$WRAPPER_PATH"
install -m 0755 "$script_dir/trustalo-virus-event.sh" "$HOOK_PATH"

# ---- clamd config -----------------------------------------------------------
echo "==> Configuring $SCAN_CONF"
drop_example "$SCAN_CONF"
ensure_directive "$SCAN_CONF" "LocalSocket" "/run/clamd.scan/clamd.sock"
ensure_directive "$SCAN_CONF" "VirusEvent" "$HOOK_PATH"

# ---- SELinux ----------------------------------------------------------------
# Let clamd scan files across the whole filesystem. Guarded so it is a no-op on
# hosts where SELinux is Disabled or getenforce is absent. We never disable it.
if command -v getenforce >/dev/null 2>&1; then
  selinux_mode="$(getenforce 2>/dev/null || echo Disabled)"
  if [ "$selinux_mode" != "Disabled" ]; then
    echo "==> SELinux is $selinux_mode; setting antivirus_can_scan_system"
    setsebool -P antivirus_can_scan_system 1 || \
      echo "WARNING: setsebool failed; clamd may be denied read access to some paths" >&2
  fi
fi

# ---- signature database -----------------------------------------------------
echo "==> Configuring $FRESHCLAM_CONF"
drop_example "$FRESHCLAM_CONF"

if ! ls /var/lib/clamav/daily.cvd /var/lib/clamav/daily.cld >/dev/null 2>&1; then
  echo "==> No signature DB yet; priming with freshclam"
  freshclam || echo "WARNING: initial freshclam failed; clamd@scan may not start until it succeeds" >&2
fi

# Enable signature auto-updates: prefer the packaged freshclam service, else
# install a twice-daily timer of our own.
if systemctl list-unit-files 2>/dev/null | grep -q '^clamav-freshclam\.service'; then
  echo "==> Enabling packaged clamav-freshclam.service"
  systemctl enable --now clamav-freshclam.service
else
  echo "==> No packaged freshclam service; installing trustalo-freshclam timer (twice daily)"
  cat >/etc/systemd/system/trustalo-freshclam.service <<'UNIT'
[Unit]
Description=Trustalo ClamAV signature update (freshclam)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/freshclam
UNIT
  cat >/etc/systemd/system/trustalo-freshclam.timer <<'UNIT'
[Unit]
Description=Update ClamAV signatures twice daily

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=30m
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now trustalo-freshclam.timer
fi

# ---- clamd ------------------------------------------------------------------
echo "==> Enabling clamd@scan"
# The clamd package ships a tmpfiles rule for /run/clamd.scan; make sure it is
# applied before the first start (no-op if already present).
systemd-tmpfiles --create 2>/dev/null || true
systemctl enable --now clamd@scan

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
echo "  clamdscan --config-file=$SCAN_CONF --ping 3"
echo "  systemctl status clamd@scan trustalo-clamav-scan.timer"
echo "  sudo $WRAPPER_PATH && cat $STATE_DIR/last-scan.json"
