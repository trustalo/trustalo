#!/usr/bin/env bash
#
# trustalo-virus-event.sh — Trustalo ClamAV VirusEvent hook.
#
# clamd invokes this command whenever it detects a virus (on-access or during a
# scan) and exposes the finding through two environment variables:
#
#   $CLAM_VIRUSEVENT_VIRUSNAME   the matched signature name
#   $CLAM_VIRUSEVENT_FILENAME    the offending file path
#
# We append a single JSON record to events.jsonl (source "realtime") and
# self-truncate the file to the last 1000 lines to bound its growth. The
# Trustalo device agent (unprivileged) tails this file, so it stays 0644.
#
#   Linux:  ${STATE_DIR}/events.jsonl   (default /var/lib/trustalo/av/clamav)
#   macOS:  ${STATE_DIR}/events.jsonl   (default /Library/Application Support/Trustalo/av/clamav)
#
# Wire it up in clamd.conf with:  VirusEvent /usr/local/bin/trustalo-virus-event.sh
set -euo pipefail

# ---- per-OS default state dir ----------------------------------------------
case "$(uname -s)" in
  Darwin) default_state="/Library/Application Support/Trustalo/av/clamav" ;;
  *)      default_state="/var/lib/trustalo/av/clamav" ;;
esac
STATE_DIR="${STATE_DIR:-$default_state}"
events_file="$STATE_DIR/events.jsonl"

# clamd may not populate these in every context; fall back to a marker rather
# than emitting an empty field.
signature="${CLAM_VIRUSEVENT_VIRUSNAME:-unknown}"
file_path="${CLAM_VIRUSEVENT_FILENAME:-unknown}"

# json_escape emits the JSON-string-escaped form of $1 (no surrounding quotes).
# Escapes backslash, double-quote and control characters (U+0000..U+001F);
# raw UTF-8 bytes >= 0x20 are valid JSON and pass through untouched.
json_escape() {
  local str="$1" out="" i ch code esc
  local len="${#str}"
  for (( i = 0; i < len; i++ )); do
    ch="${str:i:1}"
    case "$ch" in
      \\) out="${out}\\\\" ;;
      '"') out="${out}\\\"" ;;
      $'\n') out="${out}\\n" ;;
      $'\r') out="${out}\\r" ;;
      $'\t') out="${out}\\t" ;;
      *)
        printf -v code '%d' "'$ch"
        # High bytes of a multibyte UTF-8 char read as a signed byte come back
        # negative (e.g. 0xC3 -> -61); fold to 0..255 so they pass through raw
        # (valid JSON) instead of being mistaken for a control character.
        if [ "$code" -lt 0 ]; then
          code=$((code + 256))
        fi
        if [ "$code" -lt 32 ]; then
          printf -v esc '\\u%04x' "$code"
          out="${out}${esc}"
        else
          out="${out}${ch}"
        fi
        ;;
    esac
  done
  printf '%s' "$out"
}

# Best-effort: ensure the target exists. On a correctly provisioned host the
# setup script already created the dir (owned by the clamd user); these are
# no-ops then.
mkdir -p "$STATE_DIR" 2>/dev/null || true
if [ ! -f "$events_file" ]; then
  : >"$events_file" 2>/dev/null || true
  chmod 0644 "$events_file" 2>/dev/null || true
fi

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
line="$(printf '{"detectedAt":"%s","signature":"%s","file":"%s","source":"realtime"}' \
  "$ts" "$(json_escape "$signature")" "$(json_escape "$file_path")")"

# A single line shorter than PIPE_BUF appends atomically even if clamd fires
# several hooks concurrently.
printf '%s\n' "$line" >>"$events_file"

# Self-truncate to the last 1000 lines, atomically via a temp file in the same
# directory. Best-effort — a lost truncation just means the file is briefly
# longer than the cap.
if [ "$(wc -l <"$events_file" 2>/dev/null || echo 0)" -gt 1000 ]; then
  tmp="$(mktemp "${events_file}.XXXXXX")"
  tail -n 1000 "$events_file" >"$tmp"
  chmod 0644 "$tmp"
  mv -f "$tmp" "$events_file"
fi
