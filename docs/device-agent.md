# Device posture agent

The Trustalo device agent (`apps/device-agent`, Go) runs on employee endpoints and heartbeats their security posture — disk encryption, host firewall, screen lock, antivirus/EDR, and agent health. Each enrolled device is 1:1 with a **Computer-category `Asset`** and is assigned to a **`Person`** (see [`people.md`](people.md)).

> **Inventory vs. compliance.** A device's self-reported posture is _inventory telemetry_ and is stored inline on the `Device`/`Asset` row. The _compliance interpretation_ is emitted as advisory `Evidence` (`pending_review`) — never an auto-approved verdict.

## Enrollment & authentication

- **Browser sign-in (shipped agent)**: `agentd login` opens the browser to the web `/device/authorize` consent page. The browser owns the login — password **or** SSO, whatever the tenant's provider is — then deep-links a one-time, PKCE-bound code back via `trustalo://`. The agent exchanges it (`POST /auth/device/token`) for a device JWT and enrolls. No login form or shared secret ships in the agent. See the PKCE device-authorization endpoints in `apps/api/src/modules/auth` and the `DeviceAuthCode` model.
- **Interactive (dev)**: a signed-in user enrolls their own machine (`POST /api/v1/devices/enroll`) using their JWT — no token needed.
- **Mass-deploy / MDM**: an admin mints a short-lived, consumable `DeviceEnrollmentToken` (`POST /api/v1/devices/enrollment-tokens`) that the agent presents once.

On enrollment the server resolves the enrolling user → their `Person` and sets `Device.personId` + the Computer `Asset.assignedPersonId`, then returns a **per-device HMAC secret** (stored reversibly encrypted via the AES-256-GCM crypto-envelope). Every check-in is HMAC-signed over a canonical string with a nonce + timestamp (replay defense via the `DeviceNonce` ledger). See `apps/api/src/lib/device-auth.ts`.

## Check-in & evidence

Each check-in updates the device's inline posture and appends a `DevicePostureSnapshot` (append-only history). Advisory `Evidence` is emitted **only for signals that changed state** since the previous check-in, mapped to controls via the `endpoint-agent` manifest (SOC 2 CC6.x/7.x, ISO A.8.x). A stale-device sweep flips silent devices to `stale` and raises an agent-health finding.

## Web UI

The **Devices** page (`/devices`, requires `assets:read`) lists every enrolled device with its posture signals, status, last-seen time, and **assigned person**. Admins (`assets:write`) can revoke a device. A person's fleet and its posture also appear on the **Devices** tab of their People profile.

## Cross-platform builds

The agent is Go for single-binary cross-compilation (`GOOS`/`GOARCH`); the headless daemon (`cmd/agentd`) builds with `CGO_ENABLED=0`. The resident **menu-bar app** (`cmd/tray`) runs the same agent runtime in-process and shows the Trustalo logo, live status, and Check-in / Sign-in / Quit actions — it stays resident until the user quits. Per-OS collectors read native posture (macOS / Windows / Linux). Release builds are produced by `.github/workflows/agent.yml`.
