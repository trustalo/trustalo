#!/usr/bin/env bash
#
# macos-setup.sh — install + configure ClamAV and the Trustalo scan tooling on
# macOS (Homebrew). Idempotent.
#
# Run this as your normal admin user, NOT with sudo: Homebrew must not run as
# root. The script calls `sudo` itself only for the few privileged steps —
# creating the state dir under /Library, installing the CLI into /usr/local/bin,
# and loading LaunchDaemons.
#
#   ./macos-setup.sh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

STATE_DIR="/Library/Application Support/Trustalo/av/clamav"
BIN_DIR="/usr/local/bin"
HOOK_PATH="$BIN_DIR/trustalo-virus-event.sh"
WRAPPER_PATH="$BIN_DIR/trustalo-clamav-scan.sh"
LAUNCH_DAEMONS="/Library/LaunchDaemons"

if [ "$(id -u)" -eq 0 ]; then
  echo "Run macos-setup.sh as your normal user, not with sudo (Homebrew refuses" >&2
  echo "to run as root). The script uses sudo internally where it must." >&2
  exit 1
fi
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found. Install it from https://brew.sh first." >&2
  exit 1
fi

invoking_user="$(id -un)"

# ---- helpers ----------------------------------------------------------------

# ensure_directive rewrites $file so `$key $value` is the single active setting
# for $key (strips active + commented occurrences, appends ours). No sudo: the
# Homebrew config files are owned by the invoking user.
ensure_directive() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  grep -vE "^[[:space:]]*#?[[:space:]]*${key}([[:space:]]|\$)" "$file" >"$tmp" || true
  printf '%s %s\n' "$key" "$value" >>"$tmp"
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

drop_example() {
  local file="$1" tmp
  [ -f "$file" ] || return 0
  tmp="$(mktemp)"
  grep -vE '^[[:space:]]*Example[[:space:]]*$' "$file" >"$tmp" || true
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

# ---- install clamav ---------------------------------------------------------
echo "==> Installing ClamAV via Homebrew (as $invoking_user)"
brew install clamav || brew upgrade clamav || true

brew_prefix="$(brew --prefix)"
clamav_etc="$brew_prefix/etc/clamav"
clamd_conf="$clamav_etc/clamd.conf"
freshclam_conf="$clamav_etc/freshclam.conf"
socket_path="$brew_prefix/var/run/clamd.sock"

# ---- seed configs from the .sample templates --------------------------------
echo "==> Seeding ClamAV config in $clamav_etc"
if [ ! -f "$clamd_conf" ] && [ -f "$clamd_conf.sample" ]; then
  cp "$clamd_conf.sample" "$clamd_conf"
fi
if [ ! -f "$freshclam_conf" ] && [ -f "$freshclam_conf.sample" ]; then
  cp "$freshclam_conf.sample" "$freshclam_conf"
fi

mkdir -p "$brew_prefix/var/run"

drop_example "$clamd_conf"
drop_example "$freshclam_conf"
ensure_directive "$clamd_conf" "LocalSocket" "$socket_path"
ensure_directive "$clamd_conf" "VirusEvent" "$HOOK_PATH"

# ---- signature database -----------------------------------------------------
echo "==> Priming signatures with freshclam"
freshclam || echo "WARNING: freshclam failed; clamd will not start until signatures exist" >&2

# ---- state dir (privileged) -------------------------------------------------
# World-readable so the unprivileged Trustalo agent can tail the contract files.
# Owned by the invoking user (whom clamd runs as under brew services) so the
# realtime VirusEvent hook can append; the root scheduled scan chowns back to it.
echo "==> Creating state dir $STATE_DIR (owner ${invoking_user}, 0755) [sudo]"
sudo install -d -o "$invoking_user" -g staff -m 0755 "$STATE_DIR"

# ---- install the CLI (privileged) -------------------------------------------
echo "==> Installing scan wrapper + VirusEvent hook into $BIN_DIR [sudo]"
sudo install -d -m 0755 "$BIN_DIR"
sudo install -m 0755 "$script_dir/trustalo-clamav-scan.sh" "$WRAPPER_PATH"
sudo install -m 0755 "$script_dir/trustalo-virus-event.sh" "$HOOK_PATH"

# ---- start clamd ------------------------------------------------------------
# Prefer Homebrew's own service; if the formula ships none, install a
# LaunchDaemon that runs clamd (as the invoking user) in the foreground.
if brew services list 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx clamav; then
  echo "==> Starting clamd via brew services"
  brew services restart clamav || brew services start clamav || true
else
  echo "==> Homebrew ships no clamav service; installing com.trustalo.clamd LaunchDaemon [sudo]"
  clamd_bin="$brew_prefix/sbin/clamd"
  [ -x "$clamd_bin" ] || clamd_bin="$(command -v clamd)"
  ensure_directive "$clamd_conf" "Foreground" "yes"
  sudo tee "$LAUNCH_DAEMONS/com.trustalo.clamd.plist" >/dev/null <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.trustalo.clamd</string>
  <key>ProgramArguments</key>
  <array>
    <string>$clamd_bin</string>
    <string>--config-file=$clamd_conf</string>
  </array>
  <key>UserName</key><string>$invoking_user</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
PLIST
  sudo launchctl unload "$LAUNCH_DAEMONS/com.trustalo.clamd.plist" 2>/dev/null || true
  sudo launchctl load -w "$LAUNCH_DAEMONS/com.trustalo.clamd.plist"
fi

# ---- twice-daily freshclam --------------------------------------------------
echo "==> Installing com.trustalo.freshclam LaunchDaemon (twice daily) [sudo]"
freshclam_bin="$brew_prefix/bin/freshclam"
[ -x "$freshclam_bin" ] || freshclam_bin="$(command -v freshclam)"
sudo tee "$LAUNCH_DAEMONS/com.trustalo.freshclam.plist" >/dev/null <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.trustalo.freshclam</string>
  <key>ProgramArguments</key>
  <array>
    <string>$freshclam_bin</string>
    <string>--config-file=$freshclam_conf</string>
  </array>
  <key>UserName</key><string>$invoking_user</string>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>16</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
PLIST
sudo launchctl unload "$LAUNCH_DAEMONS/com.trustalo.freshclam.plist" 2>/dev/null || true
sudo launchctl load -w "$LAUNCH_DAEMONS/com.trustalo.freshclam.plist"

# ---- scheduled scan LaunchDaemon --------------------------------------------
echo "==> Installing the scheduled-scan LaunchDaemon [sudo]"
sudo install -m 0644 "$script_dir/launchd/com.trustalo.clamav-scan.plist" \
  "$LAUNCH_DAEMONS/com.trustalo.clamav-scan.plist"
sudo launchctl unload "$LAUNCH_DAEMONS/com.trustalo.clamav-scan.plist" 2>/dev/null || true
sudo launchctl load -w "$LAUNCH_DAEMONS/com.trustalo.clamav-scan.plist"

echo
echo "Done. Verify with:"
echo "  clamdscan --ping 3                       # daemon reachable"
echo "  sudo $WRAPPER_PATH                        # run a scan now"
echo "  cat \"$STATE_DIR/last-scan.json\""
