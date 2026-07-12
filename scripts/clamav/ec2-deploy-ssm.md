# Rolling ClamAV + the Trustalo agent out to EC2 via SSM

This is the Amazon Linux 2023 path (x86_64 and arm64/Graviton). Each instance gets ClamAV configured by [`amazonlinux-setup.sh`](./amazonlinux-setup.sh), then the Trustalo device agent (`trustalo-agent` rpm, binary `trustalo-agentd`) enrolled with a one-time token pulled from **SSM Parameter Store**.

## Prerequisites

- Instances run the SSM agent and have an instance profile with `AmazonSSMManagedInstanceCore` **plus** `ssm:GetParameter` (and `kms:Decrypt` for the token's KMS key).
- A copy of `scripts/clamav/` reachable from the instance — e.g. synced to S3 (`aws s3 sync scripts/clamav s3://<bucket>/clamav/`) or cloned from the repo.
- Two SSM parameters:
  - `/trustalo/agent/enrollment-token` — **SecureString**, a `det_…` token minted via `POST /api/v1/devices/enrollment-tokens` (or the Devices page).
  - `/trustalo/agent/api-url` — String, e.g. `https://acme.trustalo.io`.
- The `trustalo-agent` rpm published somewhere reachable (S3 or an https URL). goreleaser builds it as `trustalo-agent_<version>_linux_<amd64|arm64>.rpm` (nfpm `bindir` = `/usr/local/bin`, so the binary lands at `/usr/local/bin/trustalo-agentd`).

## What the agent CLI actually does

Confirmed against [`apps/device-agent/cmd/agentd/main.go`](../../apps/device-agent/cmd/agentd/main.go) and [`internal/config/config.go`](../../apps/device-agent/internal/config/config.go):

- Subcommands: `login`, `handle-url`, `install`, `uninstall`, `start`, `stop`, `restart`; flag `--once` runs a single collect + check-in; `--config <path>` selects the config file.
- Config keys: `apiUrl`, `webUrl`, `authMethod` (`basic` | `token`), `checkInIntervalSeconds`, and `dev.enrollmentToken`.
- Env overrides (win over the file): `TRUSTALO_API_URL`, `TRUSTALO_AUTH_METHOD`, `TRUSTALO_ENROLLMENT_TOKEN`.
- The enrollment token is consumed on the **first** check-in; afterwards the agent signs check-ins with the per-device HMAC secret in `credential.json`, so the token is not needed at steady state.
- `install` registers the service through `kardianos/service` with **no extra arguments**, so the running daemon resolves its config from the default path (`$HOME/.config/trustalo-agent/agent.config.json`, i.e. `/root/.config/...` for a root service), not from a `--config` you passed to `install`. The flow below handles this: it enrolls once with `--config`/token, then sets `TRUSTALO_API_URL` for the resident service via a systemd drop-in.

## The rollout script (what SSM runs on each instance)

```bash
#!/usr/bin/env bash
set -euo pipefail

REGION="$(curl -s http://169.254.169.254/latest/meta-data/placement/region)"
ARCH="$(uname -m)"                       # x86_64 | aarch64
case "$ARCH" in x86_64) RPM_ARCH=amd64;; aarch64) RPM_ARCH=arm64;; esac

# 1. ClamAV + Trustalo scan tooling.
aws s3 sync s3://<bucket>/clamav/ /opt/trustalo-clamav/ --region "$REGION"
sudo bash /opt/trustalo-clamav/amazonlinux-setup.sh

# 2. Install the agent rpm (built for this arch). dnf can't fetch s3:// URLs,
#    so download first (or point it straight at an https URL).
aws s3 cp "s3://<bucket>/agent/trustalo-agent_latest_linux_${RPM_ARCH}.rpm" \
  /tmp/trustalo-agent.rpm --region "$REGION"
sudo dnf install -y /tmp/trustalo-agent.rpm

# 3. Config: token auth pointed at your instance.
API_URL="$(aws ssm get-parameter --name /trustalo/agent/api-url \
  --query Parameter.Value --output text --region "$REGION")"
TOKEN="$(aws ssm get-parameter --name /trustalo/agent/enrollment-token \
  --with-decryption --query Parameter.Value --output text --region "$REGION")"

sudo install -d -m 0755 /etc/trustalo
sudo tee /etc/trustalo/agent.config.json >/dev/null <<JSON
{
  "apiUrl": "${API_URL}",
  "authMethod": "token"
}
JSON

# 4. Enroll once (token consumed here; writes /root/.config/trustalo-agent/credential.json).
sudo env TRUSTALO_ENROLLMENT_TOKEN="$TOKEN" \
  trustalo-agentd --config /etc/trustalo/agent.config.json --once

# 5. Point the resident service at the right API (the installed unit ignores
#    --config), then register + start it. TRUSTALO_REQUIRE_AV /
#    TRUSTALO_EXPECTED_AV_PRODUCTS make a missing or unhealthy ClamAV report
#    avHealth=fail instead of leaving it undetermined — enable once ClamAV is
#    rolled out fleet-wide.
sudo mkdir -p /etc/systemd/system/trustalo-agent.service.d
sudo tee /etc/systemd/system/trustalo-agent.service.d/10-trustalo.conf >/dev/null <<CONF
[Service]
Environment=TRUSTALO_API_URL=${API_URL}
Environment=TRUSTALO_REQUIRE_AV=true
Environment=TRUSTALO_EXPECTED_AV_PRODUCTS=clamav
CONF

sudo trustalo-agentd install
sudo systemctl daemon-reload
sudo trustalo-agentd start
```

Keep the token out of shell history and process listings where you can — the `env VAR=… cmd` form above keeps it off `ps` for other users but it is still in the instance's memory; rely on short-lived, single-use enrollment tokens.

## Kicking it off with `aws ssm send-command`

Target a fleet by tag and run the script from S3:

```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --comment "Trustalo ClamAV + agent rollout" \
  --targets "Key=tag:trustalo-managed,Values=true" \
  --parameters '{"commands":["aws s3 cp s3://<bucket>/clamav/ec2-rollout.sh /tmp/rollout.sh --region '"$AWS_REGION"'","sudo bash /tmp/rollout.sh"]}' \
  --region "$AWS_REGION"
```

(Store the "rollout script" block above as `ec2-rollout.sh` alongside the `clamav/` files in S3.) Track progress with `aws ssm list-command-invocations --command-id <id> --details`.

## Verify afterwards

```bash
clamdscan --config-file=/etc/clamd.d/scan.conf --ping 3   # daemon up
systemctl status clamd@scan trustalo-clamav-scan.timer trustalo-agent
cat /var/lib/trustalo/av/clamav/last-scan.json            # scan contract file
```

The device then appears under **Assets → Device posture** with `av=pass` once the agent's next check-in lands (the Linux collector keys off `systemctl is-active clamd@scan` / `clamav-daemon`, and reads the contract files this tooling writes).
