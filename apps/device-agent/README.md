# Trustalo device agent

Cross-platform (macOS / Windows / Linux) endpoint-posture agent, written in Go. It enrolls a machine once, then heartbeats its security posture — disk encryption, host firewall, screen lock, antivirus/EDR, agent health — to the Trustalo API. Each enrolled machine becomes a Computer-category **Asset** assigned to the enrolling **Person**. See [`../../docs/device-agent.md`](../../docs/device-agent.md) and [`../../docs/people.md`](../../docs/people.md).

## Run & test locally

Prereqs: Go 1.23+ and the local API running on `:15002` with a seeded DB (`bun dev` from the repo/worktree root). Everything below is driven by the [`Makefile`](Makefile) — run `make help` for the full list.

```bash
cd apps/device-agent

make app       # the resident menu-bar app — Trustalo icon, runs the agent
               #   in-process, stays until you pick "Quit" from the menu
make once      # build + enroll this machine + send ONE check-in, then exit
make loop      # run the heartbeat in the terminal (30s interval; Ctrl-C to stop)
make reset     # forget the local enrollment (re-enrolls on the next run)
make test      # go test ./...
make clean     # remove build output + local credential/status files
```

`make app` (alias of `make tray`) is the real product experience: a menu-bar / system-tray app showing the Trustalo logo, a live status (compliant / N issues), and **Check in now**, **Sign in…**, **Open Trustalo**, and **Quit** actions. It runs the heartbeat in-process and stays resident until you Quit. `make once` / `make loop` are the headless CLI equivalents; `agentd install` runs the daemon under launchd/systemd/SCM for servers and MDM.

`make once` against a freshly seeded DB prints, e.g.:

```
[agent] v0.0.1-dev api=http://localhost:15002 auth=basic
[agent] check-in ok: status=active evidence=0 disk=pass fw=fail lock=unknown av=pass
```

Then confirm it in the web UI: **Assets → Device posture** (the `/devices` page), or open the enrolling person under **People → <you> → Devices**. The device shows live posture and its assigned person.

### Sign-in / enrollment

The agent authenticates once to enroll. There are three ways:

**1. Browser sign-in (the production flow).** Works against ANY auth provider — the browser owns the login (password OR SSO), then deep-links back to the agent.

```bash
make login        # asks for the Trustalo URL, opens the browser, waits, enrolls
```

It opens `…/device/authorize`; you sign in + consent there, and the browser deep-links a one-time, PKCE-bound code back via `trustalo://`. The agent exchanges it for a device JWT and enrolls — no password ever touches the agent.

For the `trustalo://` deep link to route on macOS during local dev, register a handler once:

```bash
make scheme-macos     # registers trustalo:// → handle-url (osascript .app + lsregister)
# …later: make unscheme-macos
```

If you don't register it (or are on a headless box), use the **manual fallback**: the browser's "sent" screen shows the `trustalo://…` URL — copy it and run:

```bash
make handle-url URL='trustalo://auth/callback?code=…&state=…'
```

(or set `TRUSTALO_NO_BROWSER=1` so `make login` just prints the URL to open).

**2. Basic auth (dev shortcut).** Skips the browser; uses the seeded owner.

```bash
make once EMAIL=you@company.com PASSWORD=secret
```

**3. Admin enrollment token (MDM / mass-deploy).** Mint one via `POST /api/v1/devices/enrollment-tokens` (or the Devices page):

```bash
make once AUTH=token TOKEN=det_xxxxxxxx
```

After enrollment the per-device HMAC secret is saved to `./credential.json` and reused; subsequent check-ins are signed, not re-authenticated. `make reset` deletes it to start over (the server re-uses the same Asset by hardware id).

> Production builds register `trustalo://` via the packaged app's Info.plist (macOS), registry (Windows), or a `.desktop` `x-scheme-handler/trustalo` (Linux); `make scheme-macos` is the local-dev equivalent.

## Configuration

Resolution order: **CLI flags > env vars > `agent.config.json` > build-time defaults.**

| Env var | Config key | Default | Purpose |
| --- | --- | --- | --- |
| `TRUSTALO_API_URL` | `apiUrl` | `http://localhost:15002` | API base URL |
| `TRUSTALO_WEB_URL` | `webUrl` | `http://localhost:15000` | Allowed origin for the login call |
| `TRUSTALO_AUTH_METHOD` | `authMethod` | `basic` | `basic` \| `token` |
| `TRUSTALO_AGENT_EMAIL` / `_PASSWORD` | `dev.email` / `dev.password` | — | basic-auth sign-in |
| `TRUSTALO_ENROLLMENT_TOKEN` | `dev.enrollmentToken` | — | token enrollment |
| `TRUSTALO_CHECKIN_INTERVAL_SECONDS` | `checkInIntervalSeconds` | `3600` | heartbeat cadence |

`make config` scaffolds a local `agent.config.json` from `agent.config.example.json`. Local runtime files (`agent.config.json`, `credential.json`, `status.json`) are **gitignored** — never commit device credentials. Per-customer release builds bake `apiUrl` / `authMethod` via `-ldflags -X` (see [`.goreleaser.yaml`](.goreleaser.yaml)).

## Flags (`dist/trustalo-agentd`)

```
--config <path>   path to agent.config.json
--creds  <path>   path to the device credential store
--status <path>   path to the tray status file
--once            run a single collect + check-in, then exit (dev)
install | uninstall | start | stop | restart   manage the OS service
```

Installed as a system service it runs under launchd / systemd / Windows SCM (via `kardianos/service`) and writes the status file the tray reads.

## Layout

```
cmd/agentd        headless daemon / CLI (login, handle-url, service verbs)
cmd/tray          resident menu-bar app — runs the agent in-process + UI
internal/agent    the runtime: enroll → heartbeat loop → signed check-ins (shared)
internal/authflow browser sign-in (PKCE device-authorization + trustalo:// IPC)
internal/browser  cross-platform "open URL in browser"
internal/collect  per-OS posture collectors (darwin/windows/linux)
internal/apiclient login + enroll + check-in + device-token HTTP client
internal/report   per-device HMAC signing (mirrors apps/api/src/lib/device-auth.ts)
internal/keystore file-backed credential store
internal/config   layered config resolution + sanitized Save
internal/ipc      status file shared between the loop and the tray UI
internal/trayicon embedded Trustalo logo (PNG for macOS/Linux, ICO for Windows)
```
