#!/usr/bin/env bash
#
# trustalo-clamav-scan.sh — Trustalo scheduled ClamAV scan wrapper.
#
# Runs a full clamdscan over the configured targets, then writes the
# machine-readable "last scan" contract file the Trustalo device agent reads:
#
#   Linux:  ${STATE_DIR}/last-scan.json   (default /var/lib/trustalo/av/clamav)
#   macOS:  ${STATE_DIR}/last-scan.json   (default /Library/Application Support/Trustalo/av/clamav)
#
# It also appends any detections to events.jsonl with "source":"scheduled",
# mirroring the realtime VirusEvent hook (trustalo-virus-event.sh).
#
# The agent runs unprivileged, so the state dir is 0755 and the files are 0644.
# last-scan.json is written atomically (temp file in the same dir + mv).
#
# Configuration (env, all optional):
#   SCAN_TARGETS   space-separated paths to scan
#                  (Linux default: /home /etc /usr/local /var/www /tmp)
#                  (macOS default: /Users /Applications)
#   STATE_DIR      where to write the contract files (per-OS default above)
#
# Exit status mirrors clamdscan: 0 clean, 1 infected, 2 (or other) error.
#
# Usage:
#   trustalo-clamav-scan.sh
#   SCAN_TARGETS="/home /srv" STATE_DIR=/var/lib/trustalo/av/clamav trustalo-clamav-scan.sh
set -euo pipefail

# ---- per-OS defaults --------------------------------------------------------
os_name="$(uname -s)"
case "$os_name" in
  Darwin)
    default_targets="/Users /Applications"
    default_state="/Library/Application Support/Trustalo/av/clamav"
    ;;
  *)
    default_targets="/home /etc /usr/local /var/www /tmp"
    default_state="/var/lib/trustalo/av/clamav"
    ;;
esac

SCAN_TARGETS="${SCAN_TARGETS:-$default_targets}"
STATE_DIR="${STATE_DIR:-$default_state}"

last_scan_file="$STATE_DIR/last-scan.json"
events_file="$STATE_DIR/events.jsonl"

# ---- helpers ----------------------------------------------------------------

# now_utc prints an RFC3339 UTC timestamp (e.g. 2026-07-12T01:24:11Z).
now_utc() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

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

# dir_owner prints "uid:gid" of $1 (GNU stat, then BSD stat), or nothing.
dir_owner() {
  stat -c '%u:%g' "$1" 2>/dev/null || stat -f '%u:%g' "$1" 2>/dev/null || true
}

# reown, when running as root, chowns $1 to the state-dir owner so the realtime
# VirusEvent hook (which runs as the clamd daemon user) keeps write access.
reown() {
  if [ "$run_as_root" -eq 1 ] && [ -n "$state_dir_owner" ]; then
    chown "$state_dir_owner" "$1" 2>/dev/null || true
  fi
}

# append_event appends one events.jsonl record and self-truncates to the last
# 1000 lines. Args: signature, file, source.
append_event() {
  local sig="$1" file="$2" source="$3" ts line tmp
  ts="$(now_utc)"
  line="$(printf '{"detectedAt":"%s","signature":"%s","file":"%s","source":"%s"}' \
    "$ts" "$(json_escape "$sig")" "$(json_escape "$file")" "$source")"
  printf '%s\n' "$line" >>"$events_file"
  if [ "$(wc -l <"$events_file" 2>/dev/null || echo 0)" -gt 1000 ]; then
    tmp="$(mktemp "${events_file}.XXXXXX")"
    tail -n 1000 "$events_file" >"$tmp"
    chmod 0644 "$tmp"
    mv -f "$tmp" "$events_file"
  fi
  reown "$events_file"
}

# write_last_scan writes last-scan.json atomically (temp file in same dir + mv).
# Args: startedAt finishedAt exitCode result infectedCount scannedField detectionsJson
write_last_scan() {
  local started="$1" finished="$2" code="$3" result="$4" infected="$5" scanned="$6" dets="$7" tmp
  tmp="$(mktemp "${last_scan_file}.XXXXXX")"
  cat >"$tmp" <<JSON
{
  "startedAt": "$started",
  "finishedAt": "$finished",
  "exitCode": $code,
  "result": "$result",
  "infectedCount": $infected,
  "scannedCount": $scanned,
  "detections": [$dets]
}
JSON
  chmod 0644 "$tmp"
  mv -f "$tmp" "$last_scan_file"
  reown "$last_scan_file"
}

# ---- prepare state dir ------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
  run_as_root=1
else
  run_as_root=0
fi

mkdir -p "$STATE_DIR"
chmod 0755 "$STATE_DIR" 2>/dev/null || true
if [ ! -f "$events_file" ]; then
  : >"$events_file"
  chmod 0644 "$events_file" 2>/dev/null || true
fi
state_dir_owner="$(dir_owner "$STATE_DIR")"

started_at="$(now_utc)"

# ---- clamdscan not installed: record an error and bail ----------------------
if ! command -v clamdscan >/dev/null 2>&1; then
  finished_at="$(now_utc)"
  write_last_scan "$started_at" "$finished_at" 2 "error" 0 "null" ""
  echo "trustalo-clamav-scan: clamdscan not found on PATH" >&2
  exit 2
fi

# ---- assemble clamdscan arguments ------------------------------------------
# --multiscan uses all clamd threads; --fdpass hands clamd the open fd so it can
# read files its own user could not. We deliberately do NOT pass --no-summary:
# we parse the summary block ("Infected files:") below.
clamdscan_args=(--multiscan --fdpass)

# Amazon Linux ships the daemon config at /etc/clamd.d/scan.conf and clamdscan
# needs to be pointed at it. Only when the Debian/Ubuntu path is absent.
if [ -f /etc/clamd.d/scan.conf ] && [ ! -f /etc/clamav/clamd.conf ]; then
  clamdscan_args+=(--config-file=/etc/clamd.d/scan.conf)
fi

# Split SCAN_TARGETS on whitespace and keep only paths that exist.
read -r -a requested_targets <<<"$SCAN_TARGETS"
scan_targets=()
for target in "${requested_targets[@]}"; do
  if [ -e "$target" ]; then
    scan_targets+=("$target")
  fi
done

if [ "${#scan_targets[@]}" -eq 0 ]; then
  finished_at="$(now_utc)"
  write_last_scan "$started_at" "$finished_at" 2 "error" 0 "null" ""
  echo "trustalo-clamav-scan: none of the scan targets exist: $SCAN_TARGETS" >&2
  exit 2
fi

# ---- run the scan -----------------------------------------------------------
scan_output="$(mktemp)"
trap 'rm -f "$scan_output"' EXIT

exit_code=0
clamdscan "${clamdscan_args[@]}" "${scan_targets[@]}" >"$scan_output" 2>&1 || exit_code=$?

finished_at="$(now_utc)"

# ---- parse output -----------------------------------------------------------
detections_json=""
detection_count=0
found_lines=0
infected_summary=""
scanned_count="null"

while IFS= read -r line; do
  case "$line" in
    *" FOUND")
      found_lines=$((found_lines + 1))
      # clamscan format: "PATH: SIGNATURE FOUND". The signature follows the last
      # ": ", so a path that itself contains ": " is still parsed correctly.
      file="${line%: *}"
      rest="${line##*: }"
      signature="${rest% FOUND}"
      append_event "$signature" "$file" "scheduled"
      if [ "$detection_count" -lt 50 ]; then
        esc_file="$(json_escape "$file")"
        esc_sig="$(json_escape "$signature")"
        if [ -n "$detections_json" ]; then
          detections_json="${detections_json},"
        fi
        detections_json="${detections_json}$(printf '{"file":"%s","signature":"%s"}' "$esc_file" "$esc_sig")"
        detection_count=$((detection_count + 1))
      fi
      ;;
    "Infected files:"*)
      n="${line#Infected files:}"
      n="${n// /}"
      case "$n" in
        ''|*[!0-9]*) : ;;
        *) infected_summary="$n" ;;
      esac
      ;;
    "Scanned files:"*)
      # clamdscan usually omits this line; keep scannedCount null when absent.
      n="${line#Scanned files:}"
      n="${n// /}"
      case "$n" in
        ''|*[!0-9]*) : ;;
        *) scanned_count="$n" ;;
      esac
      ;;
  esac
done <"$scan_output"

# ---- derive result + counts -------------------------------------------------
case "$exit_code" in
  0) result="clean" ;;
  1) result="infected" ;;
  *) result="error" ;;
esac

if [ -n "$infected_summary" ]; then
  infected_count="$infected_summary"
else
  infected_count="$found_lines"
fi

write_last_scan "$started_at" "$finished_at" "$exit_code" "$result" \
  "$infected_count" "$scanned_count" "$detections_json"

exit "$exit_code"
