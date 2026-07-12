# ClamAV host tooling for the Trustalo device agent

Host-side scripts that run ClamAV on managed endpoints and write two machine-readable **contract files** the [Trustalo device agent](../../apps/device-agent) reads on each heartbeat. The agent runs **unprivileged**, so every contract file is world-readable (`0644`) inside a world-traversable directory (`0755`).

Supported platforms:

| Platform | Package source | Daemon | Scheduler | Setup script |
| --- | --- | --- | --- | --- |
| Ubuntu 20.04+ / Debian | `apt` (`clamav-daemon`) | `clamav-daemon` | systemd timer | [`ubuntu-setup.sh`](./ubuntu-setup.sh) |
| Amazon Linux 2023 (x86_64 + arm64) | `dnf` (`clamd`) | `clamd@scan` | systemd timer | [`amazonlinux-setup.sh`](./amazonlinux-setup.sh) |
| macOS | Homebrew (`clamav`) | `clamd` (brew service / LaunchDaemon) | LaunchDaemon | [`macos-setup.sh`](./macos-setup.sh) |

## Files

| File | Purpose |
| --- | --- |
| [`trustalo-clamav-scan.sh`](./trustalo-clamav-scan.sh) | Scheduled-scan wrapper. Runs `clamdscan --multiscan --fdpass` over the configured targets, parses the summary + `FOUND` lines, and writes `last-scan.json` atomically. Also appends detections to `events.jsonl` (`source: "scheduled"`). Exits with clamdscan's own code. |
| [`trustalo-virus-event.sh`](./trustalo-virus-event.sh) | clamd `VirusEvent` hook. Appends one `events.jsonl` line (`source: "realtime"`) from `$CLAM_VIRUSEVENT_VIRUSNAME` / `$CLAM_VIRUSEVENT_FILENAME`, then self-truncates the file to its last 1000 lines. |
| [`systemd/trustalo-clamav-scan.service`](./systemd/trustalo-clamav-scan.service) · [`.timer`](./systemd/trustalo-clamav-scan.timer) | `Type=oneshot` unit + a daily timer (`RandomizedDelaySec=1h`, `Persistent=true`) for Linux. |
| [`launchd/com.trustalo.clamav-scan.plist`](./launchd/com.trustalo.clamav-scan.plist) | Daily scheduled scan on macOS (root LaunchDaemon, `StartCalendarInterval`). |
| [`ubuntu-setup.sh`](./ubuntu-setup.sh) · [`amazonlinux-setup.sh`](./amazonlinux-setup.sh) · [`macos-setup.sh`](./macos-setup.sh) | Idempotent installers (see the table above). |
| [`ec2-deploy-ssm.md`](./ec2-deploy-ssm.md) | Rolling the AL2023 setup + the agent out to EC2 via SSM Run Command. |

Configuration (env, honored by the wrapper): `SCAN_TARGETS` (space-separated paths) and `STATE_DIR`. Defaults:

- Linux — `SCAN_TARGETS="/home /etc /usr/local /var/www /tmp"`, `STATE_DIR=/var/lib/trustalo/av/clamav`
- macOS — `SCAN_TARGETS="/Users /Applications"`, `STATE_DIR=/Library/Application Support/Trustalo/av/clamav`

Non-existent targets are skipped. On Amazon Linux the wrapper auto-adds `--config-file=/etc/clamd.d/scan.conf` when that file exists and `/etc/clamav/clamd.conf` does not.

## Contract files

Written under `STATE_DIR` (Linux `/var/lib/trustalo/av/clamav`, macOS `/Library/Application Support/Trustalo/av/clamav`).

### `last-scan.json`

The most recent scheduled scan, rewritten atomically (temp file + `mv`) each run.

```json
{
  "startedAt": "2026-07-12T01:00:00Z",
  "finishedAt": "2026-07-12T01:24:11Z",
  "exitCode": 0,
  "result": "clean",
  "infectedCount": 0,
  "scannedCount": 123456,
  "detections": [{ "file": "/path", "signature": "Eicar-Signature" }]
}
```

- `result` is `"clean"` (exit 0), `"infected"` (exit 1), or `"error"` (exit 2 or other).
- `detections` come from clamdscan output lines ending in `FOUND`, capped at 50 (`infectedCount` still reflects the true total from the summary).
- `scannedCount` is `null` when clamdscan omits a "Scanned files" line (it usually does — that count is a `clamscan`, not `clamdscan`, feature).
- Timestamps are UTC RFC3339.

### `events.jsonl`

One JSON object per line, appended as detections happen; capped at ~1000 lines.

```json
{
  "detectedAt": "2026-07-12T09:15:00Z",
  "signature": "Eicar-Signature",
  "file": "/home/user/eicar.txt",
  "source": "realtime"
}
```

`source` is `"realtime"` (from the `VirusEvent` hook) or `"scheduled"` (from the scan wrapper). File paths and signatures are JSON-escaped (backslashes, quotes, and control characters), so arbitrary filenames are safe.

## Install

```bash
sudo ./ubuntu-setup.sh          # Ubuntu / Debian
sudo ./amazonlinux-setup.sh     # Amazon Linux 2023
./macos-setup.sh                # macOS — run as your user, NOT sudo
```

All three are idempotent. Each installs the wrapper + hook into `/usr/local/bin`, wires `VirusEvent` into the daemon config, creates the state dir owned by the clamd runtime user (so the realtime hook can append while the files stay world-readable), primes the signature database, and enables the scheduled scan. The Linux installers print a warning if the host has < 2 GB RAM — clamd loads the full signature set and typically needs ~1–1.5 GB resident.

## Verify

1. **Signatures downloaded** — the DB directory has `daily.*` / `main.*`:
   ```bash
   ls -l /var/lib/clamav/                      # Linux
   ls -l "$(brew --prefix)/var/lib/clamav/"    # macOS
   freshclam --version                          # prints the loaded DB version
   ```
2. **Daemon reachable** — `clamdscan --ping` returns quickly:
   ```bash
   clamdscan --ping 3                                   # Ubuntu / macOS
   clamdscan --config-file=/etc/clamd.d/scan.conf --ping 3   # Amazon Linux
   ```
3. **A scan writes the contract file**:
   ```bash
   sudo /usr/local/bin/trustalo-clamav-scan.sh
   cat "<STATE_DIR>/last-scan.json"
   ```
4. **EICAR test (safe, non-malicious).** Use the industry-standard EICAR anti-malware test file — **do not** paste the literal string into this repo; download it from the source: <https://www.eicar.org/download-anti-malware-testfile/> (the `eicar.com` / `eicar.com.txt` file). Drop it into a scanned path, e.g. `/tmp` on Linux, and either run the wrapper or let on-access catch it:
   ```bash
   # after placing the downloaded EICAR file at /tmp/eicar.com:
   clamdscan --fdpass /tmp/eicar.com            # expect: ... FOUND
   sudo /usr/local/bin/trustalo-clamav-scan.sh  # last-scan.json -> result "infected"
   tail -n 5 "<STATE_DIR>/events.jsonl"         # a matching detection line
   rm -f /tmp/eicar.com                         # clean up the test file
   ```
   The signature name reported by ClamAV for this file is `Win.Test.EICAR_HDB-1` (or similar); any `FOUND` result confirms detection, real-time eventing, and the contract-file pipeline end to end.
