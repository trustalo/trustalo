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
- **Extended posture** (carried in the check-in `raw` blob, shown on the device detail drawer): automatic OS updates, MDM/management enrollment, and — on macOS — Gatekeeper and System Integrity Protection, plus the screen-lock grace delay.
- **Hardware & OS inventory** (`raw` blob): model, manufacturer, serial number, CPU, core count, memory, boot-disk total/free, architecture, OS build, kernel, and uptime.

The `raw` blob is free-form (`Device.latestPosture` is JSON; the check-in schema accepts arbitrary keys), so new fields the agent learns to report appear in the device detail view automatically — no schema migration. Per-OS sources are all unprivileged: macOS `sysctl`/`ioreg`/`sw_vers`/`spctl`/`csrutil`/`profiles`/`sysadminctl`; Windows CIM, `dsregcmd`, and the AutoUpdate COM object (standard user); Linux `/sys`, `/proc`, `statfs`, and `systemctl is-enabled`. The Linux DMI serial number is intentionally **not** collected (it is root-only).

### Evaluated vs. optional signals

Which signals count as a **posture issue** is tenant-configurable (Settings → **Evaluated posture signals**, stored on `TenantSettings.devicePostureRequiredSignals`). A failing signal that the tenant evaluates marks the device **at-risk** (in the People readiness rollup) and raises the issue callout in the device drawer; for the four core signals it also drives advisory evidence. A failing signal **not** in the evaluated set is still collected and shown — tagged "optional" — but never raises an issue. The default evaluated set is the four core signals; admins can add the extended ones (`autoUpdate` / `mdmEnrolled` / `gatekeeper` / `sip`) or drop any they consider optional — e.g. an organization that doesn't run MDM leaves `mdmEnrolled` optional so it isn't flagged.

## Web UI

The **Device posture** page (`/devices`, under Assets, requires `assets:read`) is a fleet **summary** — every enrolled device with its core posture signals, status, last-seen time, and **assigned person**. The same summary appears on the **Devices** tab of a person's People profile. Clicking any device opens the **detail drawer** — the canonical per-device view — with the full security + extended posture, hardware/OS inventory, recent check-in history, and a link to the assigned person. Admins (`assets:write`) can revoke from the drawer or the list.

Admins also see an **Enrollment tokens** card on the same page (`apps/web/src/components/device/enrollment-tokens-card.tsx`) for the bulk-deploy flow: mint a token with a label, maximum enrollment count (1–1000), and expiry (1 hour–30 days); copy the raw value from the **show-once** dialog (the server stores only the hash, so it can never be displayed again); and list or revoke existing tokens with their status (`active` / `consumed` / `revoked` / `expired`) and use counts.

## Cross-platform builds

The agent is Go for single-binary cross-compilation (`GOOS`/`GOARCH`); the headless daemon (`cmd/agentd`) builds with `CGO_ENABLED=0`. The resident **menu-bar app** (`cmd/tray`) runs the same agent runtime in-process and shows the Trustalo logo, live status, and Check-in / Sign-in / Quit actions — it stays resident until the user quits. Per-OS collectors read native posture (macOS / Windows / Linux). Release builds are produced by `.github/workflows/agent.yml`.
