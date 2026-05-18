import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, type SpawnSyncOptionsWithBufferEncoding } from "node:child_process";

// Resolved at module-load time from the script's own location so the
// command works whether invoked via `bun run setup:local` (cwd = repo
// root) or `bun /abs/path/to/scripts/setup-local.ts` from any directory.
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type EnvTemplate = {
  from: string;
  to: string;
};

export const ENV_TEMPLATES: EnvTemplate[] = [
  { from: ".env.example", to: ".env" },
  { from: "apps/api/.env.example", to: "apps/api/.env" },
  { from: "apps/collector/.env.example", to: "apps/collector/.env" },
  { from: "apps/web/.env.example", to: "apps/web/.env.local" },
];

export function copyEnvIfMissing(
  template: EnvTemplate,
  root: string = REPO_ROOT,
  log: (message: string) => void = console.log,
): "created" | "skipped" {
  const source = path.join(root, template.from);
  const target = path.join(root, template.to);

  if (existsSync(target)) {
    log(`  - ${template.to} already exists`);
    return "skipped";
  }

  copyFileSync(source, target);
  log(`  + created ${template.to}`);
  return "created";
}

function run(
  command: string,
  args: string[],
  cwd: string = REPO_ROOT,
  options: Partial<SpawnSyncOptionsWithBufferEncoding> = {},
): void {
  const label = [command, ...args].join(" ");
  console.log(`\n$ ${label}`);

  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.error) {
    const err = result.error as NodeJS.ErrnoException;
    const hint = err.code === "ENOENT" ? ` — is "${command}" installed and on your PATH?` : "";
    console.error(`\n[setup:local] failed to run \`${label}\`: ${err.message}${hint}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `\n[setup:local] command failed with exit code ${result.status ?? "unknown"}: ${label}`,
    );
    process.exit(result.status ?? 1);
  }
}

function migrateDeploy(appPath: string): void {
  const cwd = path.join(REPO_ROOT, appPath);
  run("bun", ["run", "prisma:combine"], cwd);
  run("bunx", ["prisma", "migrate", "deploy"], cwd);
}

export function main(): void {
  console.log("Preparing local environment files...");
  for (const template of ENV_TEMPLATES) {
    copyEnvIfMissing(template);
  }

  run("docker", ["compose", "up", "-d"]);
  run("bun", ["install"]);

  run("bun", ["run", "db:generate:api"]);
  run("bun", ["run", "db:generate:collector"]);

  migrateDeploy("apps/api");
  migrateDeploy("apps/collector");

  run("bun", ["run", "db:seed:api"]);
  run("bun", ["run", "db:seed:demo:api"]);
  run("bun", ["run", "--filter", "@trustalo/collector", "db:seed"]);

  console.log("\nLocal setup complete.");
  console.log("Start the app with: bun dev:all");
}

// Guard the top-level execution so the module can be imported by tests
// without triggering docker/bun side effects.
if (import.meta.main) {
  main();
}
