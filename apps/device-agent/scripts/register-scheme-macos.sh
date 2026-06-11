#!/usr/bin/env bash
#
# Register (or remove) the trustalo:// URL scheme on macOS for LOCAL DEV, so the
# browser deep-link from /device/authorize reaches `trustalo-agentd handle-url`.
#
# macOS routes a custom scheme to an app that handles the GetURL Apple Event, so
# we build a tiny AppleScript .app whose `open location` handler shells out to
# the agent. Production ships a real .app whose Info.plist declares the scheme
# (see .goreleaser.yaml) — this script is only for `make login` to work locally.
#
#   ./scripts/register-scheme-macos.sh            register
#   ./scripts/register-scheme-macos.sh --remove   unregister
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
AGENTD="$HERE/dist/trustalo-agentd"
APP="$HERE/dist/TrustaloURLHandler.app"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister"

if [[ "${1:-}" == "--remove" ]]; then
  [[ -d "$APP" ]] && "$LSREGISTER" -u "$APP" 2>/dev/null || true
  rm -rf "$APP"
  echo "Unregistered trustalo:// dev handler."
  exit 0
fi

if [[ ! -x "$AGENTD" ]]; then
  echo "Build the agent first: make build  (expected $AGENTD)" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cat >"$TMP/handler.applescript" <<APPLESCRIPT
on open location this_URL
	do shell script "'$AGENTD' handle-url " & quoted form of this_URL
end open location
APPLESCRIPT

rm -rf "$APP"
osacompile -o "$APP" "$TMP/handler.applescript"

PLIST="$APP/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string org.trustalo.agent.dev" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string trustalo" "$PLIST"

"$LSREGISTER" -f "$APP"
echo "Registered trustalo:// → $APP"
echo "  (forwards to: $AGENTD handle-url)"
echo "Now run \`make login\`, sign in, and the browser deep-link will complete it."
echo "First use may prompt to allow the handler to run a shell command."
