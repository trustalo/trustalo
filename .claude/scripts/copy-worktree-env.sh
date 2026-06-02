#!/usr/bin/env bash
#
# copy-worktree-env.sh — mirror untracked .env files into a Claude Code worktree.
#
# Copies the local (gitignored) .env files from the repo's MAIN worktree into
# the CURRENT git worktree — but only the files the current worktree is still
# missing. Invoked by the SessionStart hook in .claude/settings.json so that
# every Claude Code worktree (created under .claude/worktrees/) starts with the
# same local environment as the main checkout.
#
# This is the Claude Code counterpart to the Cursor `setup-worktree` hook in
# .cursor/worktrees.json, which only runs for Cursor worktrees (~/.cursor/...).
#
# Safe by design: it no-ops in the main checkout, never overwrites an existing
# file, and always exits 0 so it can never block a session from starting.

set -u

# Files to mirror. Keep in sync with:
#   - scripts/setup-local.ts        (ENV_TEMPLATES targets)
#   - .cursor/worktrees.json        (setup-worktree cp lines)
ENV_FILES=(
  ".env"
  "apps/api/.env"
  "apps/collector/.env"
  "apps/web/.env.local"
)

# Current worktree root: prefer the hook-provided project dir, fall back to git.
current_root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$current_root" ] || exit 0   # not inside a git repo — nothing to do

# The MAIN worktree is always the first entry of `git worktree list`.
main_root="$(git -C "$current_root" worktree list --porcelain 2>/dev/null \
  | awk '/^worktree /{print substr($0, 10); exit}')"
[ -n "$main_root" ] || exit 0

# Running in the main checkout itself? Nothing to copy into.
[ "$current_root" = "$main_root" ] && exit 0

copied=0
for rel in "${ENV_FILES[@]}"; do
  src="$main_root/$rel"
  dst="$current_root/$rel"
  if [ -f "$src" ] && [ ! -f "$dst" ]; then
    mkdir -p "$(dirname "$dst")"
    if cp "$src" "$dst" 2>/dev/null; then
      echo "[copy-worktree-env] + $rel"
      copied=$((copied + 1))
    fi
  fi
done

[ "$copied" -gt 0 ] && echo "[copy-worktree-env] copied $copied env file(s) from $main_root"
exit 0
