# Device posture agent

The Trustalo device agent (`apps/device-agent`, Go) runs on employee endpoints and heartbeats their security posture — disk encryption, host firewall, screen lock, antivirus/EDR, and agent health. Each enrolled device is 1:1 with a **Computer-category `Asset`** and is assigned to a **`Person`** (see [`people.md`](people.md)).

> **Inventory vs. compliance.** A device's self-reported posture is _inventory telemetry_ and is stored inline on the `Device`/`Asset` row. The _compliance interpretation_ is emitted as advisory `Evidence` (`pending_review`) — never an auto-approved verdict.

## Enrollment & authentication

- **Browser sign-in (shipped agent)**: `agentd login` opens the browser to the web `/device/authorize` consent page. The browser owns the login — password **or** SSO, whatever the tenant's provider is — then deep-links a one-time, PKCE-bound code back via `trustalo://`. The agent exchanges it (`POST /auth/device/token`) for a device JWT and enrolls. No login form or shared secret ships in the agent. See the PKCE device-authorization endpoints in `apps/api/src/modules/auth` and the `DeviceAuthCode` model.
- **Interactive (dev)**: a signed-in user enrolls their own machine (`POST /api/v1/devices/enroll`) using their JWT — no token needed.
- **Mass-deploy / MDM**: an admin mints a short-lived, consumable `DeviceEnrollmentToken` (`POST /api/v1/devices/enrollment-tokens`) that the agent presents once. Tokens are managed from the **Enrollment tokens** card on the Devices page (see [Web UI](#web-ui)); mint/revoke actions are audit-logged.

On enrollment the server resolves the enrolling user → their `Person` and sets `Device.personId` + the Computer `Asset.assignedPersonId`, then returns a **per-device HMAC secret** (stored reversibly encrypted via the AES-256-GCM crypto-envelope). Every check-in is HMAC-signed over a canonical string with a nonce + timestamp (replay defense via the `DeviceNonce` ledger). See `apps/api/src/lib/device-auth.ts`.

## Check-in & evidence

Each check-in updates the device's inline posture and appends a `DevicePostureSnapshot` (append-only history). Advisory `Evidence` is emitted **only for signals that changed state** since the previous check-in **and that the tenant evaluates** (see below), mapped to controls via the `endpoint-agent` manifest (SOC 2 CC6.x/7.x, ISO A.8.x). A stale-device sweep flips silent devices to `stale`, raises an agent-health finding, prunes expired replay nonces, and **prunes posture snapshots older than 1 day** (the device keeps its latest inline posture; only the drift trail is bounded).

**Rejection handling.** The agent distinguishes _transient_ failures (network, 5xx, clock skew) — which it retries on the next heartbeat without re-authenticating — from _fatal_ ones. A fatal device-auth rejection (`DEVICE_REVOKED`, `DEVICE_KEY_MISMATCH`, `DEVICE_BAD_SIGNATURE` — i.e. the device was revoked, its secret rotated, or its identity changed) makes the agent **clear its stored credential, stop sending check-ins, and prompt the user to sign in again** (tray → red, "Sign in…"). So revoking a device server-side (or offboarding its person, which auto-revokes) immediately silences it.

## Collected signals & inventory

Every probe runs **as the logged-in user — no root/admin is required** on any OS, so the agent works from an unprivileged launchd/systemd user service or the foreground app. Anything a probe can't read is reported `unknown` (or omitted) rather than failing.

- **First-class signals** (tri-state, mapped to controls, drive advisory evidence): disk encryption, host firewall, screen lock, antivirus/EDR, agent health.
- **Extended posture** (carried in the check-in `raw` blob, shown on the device detail drawer): automatic OS updates, MDM/management enrollment, **endpoint-protection health** (see [Endpoint protection](#endpoint-protection)), and — on macOS — Gatekeeper and System Integrity Protection, plus the screen-lock grace delay.
- **Hardware & OS inventory** (`raw` blob): model, manufacturer, serial number, CPU, core count, memory, boot-disk total/free, architecture, OS build, kernel, and uptime.

The `raw` blob is free-form (`Device.latestPosture` is JSON; the check-in schema accepts arbitrary keys), so new fields the agent learns to report appear in the device detail view automatically — no schema migration. Per-OS sources are all unprivileged: macOS `sysctl`/`ioreg`/`sw_vers`/`spctl`/`csrutil`/`profiles`/`sysadminctl`; Windows CIM, `dsregcmd`, and the AutoUpdate COM object (standard user); Linux `/sys`, `/proc`, `statfs`, and `systemctl is-enabled`. The Linux DMI serial number is intentionally **not** collected (it is root-only).

### Evaluated vs. optional signals

Which signals count as a **posture issue** is tenant-configurable (Settings → **Evaluated posture signals**, stored on `TenantSettings.devicePostureRequiredSignals`). A failing signal that the tenant evaluates marks the device **at-risk** (in the People readiness rollup) and raises the issue callout in the device drawer; for the four core signals it also drives advisory evidence. A failing signal **not** in the evaluated set is still collected and shown — tagged "optional" — but never raises an issue. The default evaluated set is the four core signals; admins can add the extended ones (`autoUpdate` / `mdmEnrolled` / `gatekeeper` / `sip` / `avHealth`) or drop any they consider optional — e.g. an organization that doesn't run MDM leaves `mdmEnrolled` optional so it isn't flagged, while a fleet that standardizes on managed antivirus adds `avHealth` so an offline engine or stale signatures mark the device at-risk.

## Endpoint protection

The core `antivirus` signal only answers "is an engine running?". Alongside it the agent runs a **deep endpoint-protection probe** that reports _which_ product is installed, whether its daemon is live and responsive, how fresh its signatures are, and what its last scheduled scan and recent detections were — so an unhealthy or silently-broken AV is visible centrally instead of merely "present".

Products are modelled behind a common `Provider` interface (`internal/collect/av`) — `Name()`, `Detect()`, `Collect() → Status` — so every product reports the same product-agnostic `Status`. Which providers run is fixed per platform in `registry_<os>.go`:

- **Linux** — ClamAV
- **macOS** — ClamAV + XProtect (Apple's built-in, always-on baseline; SIP keeps it enabled)
- **Windows** — Microsoft Defender (via `Get-MpComputerStatus`, a standard-user query)

Adding a product later (e.g. ESET) is one provider file plus one registry line; the check-in payload, the server-side `avHealth` signal, and the web UI are untouched.

### Reported posture

Each check-in adds three keys to the `raw` blob:

- **`avProducts`** — the ids of every detected product (`["clamav"]`, `["clamav","xprotect"]`, …).
- **`avDetail`** — the full `Status` of the **primary** product (the first _healthy_ product, else the first _installed_ one): `product` and `installed`; the tri-state `daemonActive`, `daemonResponsive`, and `realTimeProtection` (`pass` / `fail` / `unknown`); `definitionsUpdatedAt` and `definitionsAgeHours` (signature freshness, omitted when unreadable); `lastScanAt` and `lastScanResult` (`clean` / `infected` / `error` / `missing` / `unknown`) with `infectedCount` and `scannedCount`; and `recentDetections[]`, each carrying `detectedAt`, `signature`, `file`, and `source` (`realtime` / `scheduled`).
- **`avHealth`** — the tri-state health verdict, **omitted when undeterminable** (same convention as the other extended signals). A product is healthy when it is installed, its daemon is _demonstrably_ running, its signatures are under 48 h old (when readable), and its last scheduled scan is neither `missing` nor `error`. **Infections do not fail `avHealth`** — a product that catches malware is doing its job; detections alert through the separate [`device_malware_detected`](notifications.md#alert-rules) rule. `avHealth` is an [evaluable extended signal](#evaluated-vs-optional-signals): a tenant that adds it to its evaluated set makes [`device_at_risk`](notifications.md#alert-rules) fire on unhealthy endpoint protection.

Anything a probe can't read stays `unknown` and never fails a device — with one deliberate exception: an _installed_ product whose daemon can't be shown to run at all fails `avHealth`, because "installed but not running" is exactly what central monitoring exists to catch.

The core `antivirus` signal is derived from the **same** providers, preserving the original semantics: on Linux and macOS it passes when any detected product's daemon is up (now also recognizing Amazon Linux's `clamd@scan` unit) and is `unknown` otherwise (many hosts legitimately run no AV, so absence is not a failure); on Windows it is Defender's enabled state (`pass` / `fail` / `unknown`).

### ClamAV

ClamAV is the first deep integration and the product the [host tooling](../scripts/clamav/README.md) installs. Every probe is an unprivileged read; anything unreadable degrades to `unknown` rather than failing the device falsely:

- **Daemon** — a systemd unit is `active` (`clamav-daemon` on Ubuntu/Debian, `clamd@scan` on Amazon Linux), or a `clamd` process is running on macOS.
- **Responsiveness** — a live `PING`/`PONG` over clamd's local socket, falling back to TCP `127.0.0.1:3310`. A socket that exists but won't answer is a determinate failure; no reachable endpoint at all is `unknown` (the service-state check still applies).
- **Signatures** — the newest modification time across the `daily` / `main` / `bytecode` `.cvd`/`.cld` databases; freshclam touches these on every successful update, so their age is the ground truth. Under 48 h is fresh.
- **Scheduled scans & detections** — read from two **contract files** the host tooling writes, `last-scan.json` and `events.jsonl`, under `/var/lib/trustalo/av/clamav/` on Linux and `/Library/Application Support/Trustalo/av/clamav/` on macOS. A recorded scan older than 36 h counts as `missing`, so a dead scan timer surfaces even when the last completed scan was clean. See [`scripts/clamav/`](../scripts/clamav/README.md) for the installer, scan timer, and `VirusEvent` hook that produce these files.

`realTimeProtection` stays `unknown` for ClamAV — on-access scanning (`clamonacc`) is not part of the managed setup.

### Requiring endpoint protection

Two agent-config fields (`agent.config.json`, or the installer via env) let a fleet _require_ managed endpoint protection:

- **`requireAv`** (env `TRUSTALO_REQUIRE_AV`, `1`/`true`) — when set, a check-in without a healthy allow-listed product reports `avHealth = fail` instead of leaving it undetermined, so "no AV detected at all" becomes an explicit failure the server can evaluate.
- **`expectedAvProducts`** (env `TRUSTALO_EXPECTED_AV_PRODUCTS`, comma-separated) — an optional allow-list of product ids that satisfy `requireAv` (e.g. `clamav`); empty means any detected product counts.

The policy is applied to the collected posture on each check-in (`av.EnforcePolicy`), before the report is signed and sent.

## Servers & EC2

Token enrollment (the consumable `DeviceEnrollmentToken` above) plus the headless `agentd` daemon make **server fleets first-class**, not just laptops: an EC2 instance enrolls once with an installer-baked token and heartbeats from a headless systemd service (every probe remains an unprivileged read regardless of the service account). Two behaviours keep cloud servers evaluable without false failures:

- **Disk encryption inside a VM.** The Linux probe looks for a LUKS `crypt` device; when it finds none _and_ the host is a VM — the DMI system vendor names a hypervisor/cloud platform (`amazon`, `google`, `microsoft`, `qemu`, `vmware`, …) or `/sys/hypervisor/uuid` starts with `ec2` — it reports `unknown` rather than `fail`, because host- or EBS-layer encryption is invisible from inside the guest. On bare metal, "no LUKS" is still a `fail`.
- **Headless antivirus.** ClamAV runs as a daemon with no desktop, and its health, scans, and detections all flow through the contract files above. See [`scripts/clamav/`](../scripts/clamav/README.md) for the per-distro installers and [`ec2-deploy-ssm.md`](../scripts/clamav/ec2-deploy-ssm.md) for rolling ClamAV plus the agent out across an EC2 fleet with SSM Run Command.

## Web UI

The **Device posture** page (`/devices`, under Assets, requires `assets:read`) is a fleet **summary** — every enrolled device with its core posture signals, an endpoint-protection cell (the product name, plus a destructive **Infected** badge when a scan or detection reports malware), status, last-seen time, and **assigned person**. The same summary appears on the **Devices** tab of a person's People profile. Clicking any device opens the **detail drawer** — the canonical per-device view — with the full security + extended posture (including a dedicated **Endpoint protection** section: product badge, daemon state, real-time protection, signature-definition age flagged red at ≥ 48 h, last scan, and an alert block listing any recent detections), hardware/OS inventory, recent check-in history, and a link to the assigned person. Admins (`assets:write`) can revoke from the drawer or the list.

Admins also see an **Enrollment tokens** card on the same page (`apps/web/src/components/device/enrollment-tokens-card.tsx`) for the bulk-deploy flow: mint a token with a label, maximum enrollment count (1–1000), and expiry (1 hour–30 days); copy the raw value from the **show-once** dialog (the server stores only the hash, so it can never be displayed again); and list or revoke existing tokens with their status (`active` / `consumed` / `revoked` / `expired`) and use counts.

## Cross-platform builds

The agent is Go for single-binary cross-compilation (`GOOS`/`GOARCH`); the headless daemon (`cmd/agentd`) builds with `CGO_ENABLED=0`. The resident **menu-bar app** (`cmd/tray`) runs the same agent runtime in-process and shows the Trustalo logo, live status, and Check-in / Sign-in / Quit actions — it stays resident until the user quits. Per-OS collectors read native posture (macOS / Windows / Linux). Release builds are produced by `.github/workflows/agent.yml`.
