# Trustalo device agent — local dev helpers.
#
# Quick start (with the local API running on :15002 and the DB seeded):
#   make once            # enroll this machine + send one posture check-in
#   make loop            # run the heartbeat continuously (Ctrl-C to stop)
#   make reset           # forget enrollment (re-enroll on next run)
#   make tray            # build + run the menu-bar/tray helper
#
# Sign-in + endpoints default to the local dev stack and the seeded owner.
# Override on the CLI, e.g.:  make once EMAIL=you@co.com PASSWORD=secret
# or for an admin enrollment token:  make once AUTH=token TOKEN=det_...

SHELL := /bin/bash

BIN     := dist
AGENTD  := $(BIN)/trustalo-agentd
TRAY    := $(BIN)/trustalo-agent-tray

# Local runtime state lives in the package dir and is gitignored
# (credential.json / status.json) so it never lands in the OS config dir or git.
CREDS   := ./credential.json
STATUS  := ./status.json
CONFIG  := ./agent.config.json

# Defaults target the local dev stack + the seeded owner account. `?=` means
# "only if not already set", so `make once EMAIL=...` and real env vars win.
API      ?= http://localhost:15002
WEB      ?= http://localhost:15000
AUTH     ?= basic
EMAIL    ?= test@test.com
PASSWORD ?= test.test
TOKEN    ?=
INTERVAL ?= 30

# Exported so the Go binary's config env-overlay picks them up.
export TRUSTALO_API_URL                 := $(API)
export TRUSTALO_WEB_URL                 := $(WEB)
export TRUSTALO_AUTH_METHOD             := $(AUTH)
export TRUSTALO_AGENT_EMAIL             := $(EMAIL)
export TRUSTALO_AGENT_PASSWORD          := $(PASSWORD)
export TRUSTALO_ENROLLMENT_TOKEN        := $(TOKEN)
export TRUSTALO_CHECKIN_INTERVAL_SECONDS := $(INTERVAL)

.PHONY: help build once run loop tray config reset test vet fmt clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-10s\033[0m %s\n",$$1,$$2}'

build: ## Build the agent daemon into dist/
	go build -o $(AGENTD) ./cmd/agentd

once: build ## Enroll (if needed) + a single collect/check-in, then exit
	$(AGENTD) --once --config $(CONFIG) --creds $(CREDS) --status $(STATUS)

run: once ## Alias for `once`

loop: build ## Run the heartbeat continuously (short interval; Ctrl-C to stop)
	$(AGENTD) --config $(CONFIG) --creds $(CREDS) --status $(STATUS)

tray: ## Build + run the tray/menu-bar helper (reads the status file)
	go build -o $(TRAY) ./cmd/tray
	$(TRAY) --status $(STATUS)

config: ## Scaffold a local agent.config.json from the example (gitignored)
	@if [ -f $(CONFIG) ]; then echo "$(CONFIG) already exists"; \
	else cp agent.config.example.json $(CONFIG) && echo "wrote $(CONFIG) — edit dev.email/password, or just use env defaults"; fi

reset: ## Forget the local enrollment (delete credential.json) to force re-enroll
	@rm -f $(CREDS) && echo "removed $(CREDS) — next run re-enrolls"

test: ## Run the Go test suite
	go test ./...

vet: ## go vet
	go vet ./...

fmt: ## gofmt -w the tree
	gofmt -w .

clean: ## Remove build output + local runtime state
	rm -rf $(BIN) $(CREDS) $(STATUS)
