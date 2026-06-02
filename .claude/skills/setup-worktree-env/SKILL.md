---
name: setup-worktree-env
description: >-
  Set up, refresh, or extend the Claude Code worktree env-sync mechanism for trustalo: a SessionStart hook (.claude/settings.json) that runs .claude/scripts/copy-worktree-env.sh to copy the untracked .env files from the main worktree into each new Claude Code worktree. Use when the user asks why a new worktree is missing its .env files, wants Claude Code worktrees to inherit local env automatically, or wants to add a new app's .env to the copy list. The Cursor equivalent lives in .cursor/skills/setup-worktrees-config.
---

# Setup Trustalo Worktree Env (Claude Code)

The `.env*` files are gitignored (`.env`, `.env.*` in `.gitignore`), so a freshly created git worktree has **none of them** — only the `.env.example` templates.

This repo already solves that for **Cursor** worktrees via [`.cursor/worktrees.json`](../../../.cursor/worktrees.json) (the `setup-worktree` hook, documented in [`.cursor/skills/setup-worktrees-config`](../../../.cursor/skills/setup-worktrees-config/SKILL.md)). That hook **only runs for Cursor worktrees** (created under `~/.cursor/worktrees/`). **Claude Code worktrees** (created under `.claude/worktrees/`) never trigger it — which is why a Claude Code worktree starts with no `.env` files.

This skill is the Claude Code counterpart.

## The two pieces

1. **Script** — [`.claude/scripts/copy-worktree-env.sh`](../../scripts/copy-worktree-env.sh) Copies the untracked env files from the **main worktree** (first entry of `git worktree list`) into the **current worktree**, only when the current worktree is missing them. No-ops in the main checkout; always exits 0.

2. **Hook** — `SessionStart` in [`.claude/settings.json`](../../settings.json)
   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/scripts/copy-worktree-env.sh\"",
               "statusMessage": "Syncing worktree .env files",
               "timeout": 30
             }
           ]
         }
       ]
     }
   }
   ```

## Files copied

Keep this list in sync across three places:

| File | This skill's script | `scripts/setup-local.ts` | `.cursor/worktrees.json` |
| --- | :-: | :-: | :-: |
| `.env` | ✅ | ✅ | ✅ |
| `apps/api/.env` | ✅ | ✅ | ✅ |
| `apps/collector/.env` | ✅ | ✅ | ✅ |
| `apps/web/.env.local` | ✅ | ✅ | ✅ |

To add a new app, append one entry to the `ENV_FILES` array in `copy-worktree-env.sh` (and mirror it in the two files above).

## Why SessionStart (not WorktreeCreate)

The settings schema also exposes a `WorktreeCreate` event. `SessionStart` is used instead because it runs **inside the new worktree's first session** — so `cwd` and `$CLAUDE_PROJECT_DIR` are guaranteed to be the new worktree, which is exactly what the copy script keys off. The copy is idempotent (copy-only-if-missing), so running it on every session start is harmless and also self-heals a worktree whose env files were deleted. `WorktreeCreate` fires once at creation but its working directory is the initiating session, not the new tree — easy to get wrong.

## To make it apply to future worktrees

New Claude Code worktrees branch from `main` and check out tracked files, so for the hook to fire in them, **commit these to `main`**:

- `.claude/settings.json`
- `.claude/scripts/copy-worktree-env.sh`
- `.claude/skills/setup-worktree-env/SKILL.md`

(`.claude/` is **not** gitignored in this repo.) The hook does **not** fire in the session where you first add it — the settings watcher only tracks `.claude/` for sessions that started with a settings file present. Run the script by hand once (`bash .claude/scripts/copy-worktree-env.sh`) or restart, then it is automatic.

## Assumptions to verify before changing defaults

- The main checkout is the first entry of `git worktree list` (true for the standard layout where worktrees live under `.claude/worktrees/`).
- The env file list above is complete. If a new app/service adds a local `.env`, extend all three sources.

## Output checklist

- [ ] `.claude/scripts/copy-worktree-env.sh` exists and is executable.
- [ ] `.claude/settings.json` has a valid `SessionStart` → `command` hook (no trailing commas; verify with `jq -e '.hooks.SessionStart[].hooks[].command' .claude/settings.json`).
- [ ] Env file list matches `scripts/setup-local.ts` and `.cursor/worktrees.json`.
- [ ] Files committed to `main` so future worktrees inherit them.
