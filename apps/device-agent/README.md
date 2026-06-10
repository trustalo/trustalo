# Trustalo device agent

Cross-platform (macOS / Windows / Linux) endpoint-posture agent, written in Go. It enrolls a machine once, then heartbeats its security posture — disk encryption, host firewall, screen lock, antivirus/EDR, agent health — to the Trustalo API. Each enrolled machine becomes a Computer-category **Asset** assigned to the enrolling **Person**. See [`../../docs/device-agent.md`](../../docs/device-agent.md) and [`../../docs/people.md`](../../docs/people.md).

## Run & test locally

Prereqs: Go 1.23+ and the local API running on `:15002` with a seeded DB (`bun dev` from the repo/worktree root). Everything below is driven by the [`Makefile`](Makefile) — run `make help` for the full list.

```bash
cd apps/device-agent

make once      # build + enroll this machine + send ONE check-in, then exit
make loop      # run the heartbeat continuously (30s interval; Ctrl-C to stop)
make reset     # forget the local enrollment (re-enrolls on the next run)
make tray      # build + run the menu-bar/tray helper (reads the status file)
make test      # go test ./...
make clean     # remove build output + local credential/status files
```

`make once` against a freshly seeded DB prints, e.g.:

```
[agent] v0.0.1-dev api=http://localhost:15002 auth=basic
[agent] check-in ok: status=active evidence=0 disk=pass fw=fail lock=unknown av=pass
```

Then confirm it in the web UI: **Assets → Device posture** (the `/devices` page), or open the enrolling person under **People → <you> → Devices**. The device shows live posture and its assigned person.

### Sign-in / enrollment

The agent needs to authenticate once to enroll. Override the Make defaults on the CLI:

```bash
# Basic auth (email + password) — the default; uses the seeded owner.
make once EMAIL=you@company.com PASSWORD=secret

# Admin enrollment token (non-interactive / MDM-style). Mint one via
#   POST /api/v1/devices/enrollment-tokens   (or the Devices page)
make once AUTH=token TOKEN=det_xxxxxxxx
```

After enrollment the per-device HMAC secret is saved to `./credential.json` and reused; subsequent check-ins are signed, not re-authenticated. `make reset` deletes it to start over (the server re-uses the same Asset by hardware id).

> SSO/OIDC enrollment is the planned follow-up to basic + token; the interactive browser handshake isn't wired yet.

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
cmd/agentd        daemon: enroll → heartbeat loop → signed check-ins
cmd/tray          menu-bar/system-tray status helper
internal/collect  per-OS posture collectors (darwin/windows/linux)
internal/apiclient login + enroll + check-in HTTP client
internal/report   per-device HMAC signing (mirrors apps/api/src/lib/device-auth.ts)
internal/keystore file-backed credential store
internal/config   layered config resolution
internal/ipc      status file shared with the tray
```
