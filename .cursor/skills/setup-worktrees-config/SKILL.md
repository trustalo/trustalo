---
name: setup-worktrees-config
description: >-
  Create or update the trustalo .cursor/worktrees.json so every new Cursor worktree is rebuilt from the latest origin/main, runs bun install, and copies required .env files from the root worktree. Use when the user explicitly asks to set up, refresh, or extend the trustalo worktree configuration, the setup-worktree hook, or ensure new worktrees start from the latest main.


disable-model-invocation: true
---

# Setup Trustalo Worktrees Config

Produces a `.cursor/worktrees.json` for the trustalo repo that:

1. Fetches the latest `origin/main` and hard-resets the new worktree to it.
2. Installs dependencies with `bun`.
3. Copies untracked `.env` files from `$ROOT_WORKTREE_PATH` into the new worktree.

The hook runs **once, immediately after** Cursor creates the worktree (the new branch is already checked out, CWD is the new worktree directory).

## Canonical template

Write this to `<repo>/.cursor/worktrees.json`:

```json
{
  "setup-worktree": [
    "git fetch origin main --quiet",
    "git reset --hard origin/main",
    "bun install",
    "cp $ROOT_WORKTREE_PATH/.env .env",
    "cp $ROOT_WORKTREE_PATH/apps/api/.env apps/api/.env",
    "cp $ROOT_WORKTREE_PATH/apps/collector/.env apps/collector/.env",
    "cp $ROOT_WORKTREE_PATH/apps/web/.env.local apps/web/.env.local"
  ],
  "cursor.worktreeMaxCount": 10
}
```

## Why this order matters

- **Fetch first** so `origin/main` is current before the reset.
- **Reset before install** so `bun.lockb` / `package.json` match the tree being installed against.
- **Env copies last** because they are untracked and would be wiped by the reset if done earlier.

## When extending the env list

If the user adds a new app, append a single `cp` line that mirrors the existing pattern:

```
"cp $ROOT_WORKTREE_PATH/apps/<name>/.env apps/<name>/.env"
```

Keep the order: git fetch → reset → install → env copies (root `.env` first, then nested ones).

## Assumptions to verify with the user before changing defaults

- Remote is named `origin` and trunk branch is `main`.
- Package manager is `bun` (not `pnpm` / `npm` / `yarn`).
- New worktrees are always fresh agent branches with no commits worth preserving (this is what makes `git reset --hard` safe).

If any of these change, swap the affected line — do not silently rewrite the template.

## Variants (only use if the user requests them)

| Need                                                     | Replace the reset line with        |
| -------------------------------------------------------- | ---------------------------------- |
| Preserve commits already on the worktree branch          | `git rebase origin/main`           |
| Don't modify the tree, just make `origin/main` available | _(remove the reset line entirely)_ |

## Output checklist

Before finishing:

- [ ] File written to `<repo>/.cursor/worktrees.json` (not `worktree.json`, not under `rules/`).
- [ ] Valid JSON (no trailing commas, double quotes only).
- [ ] `setup-worktree` is an array of strings.
- [ ] `cursor.worktreeMaxCount` preserved (default `10` if not set).
- [ ] Reset step appears **before** `bun install`.
- [ ] Env `cp` steps appear **after** the reset.
