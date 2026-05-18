import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import { ENV_TEMPLATES, REPO_ROOT, copyEnvIfMissing, type EnvTemplate } from "./setup-local";

function makeTempRoot(): string {
  return mkdtempSync(path.join(tmpdir(), "trustalo-setup-test-"));
}

function seedSource(root: string, template: EnvTemplate, contents: string): void {
  const source = path.join(root, template.from);
  mkdirSync(path.dirname(source), { recursive: true });
  writeFileSync(source, contents);
}

describe("setup-local script", () => {
  test("REPO_ROOT resolves to the Trustalo repo root", () => {
    expect(existsSync(path.join(REPO_ROOT, "package.json"))).toBe(true);
    expect(existsSync(path.join(REPO_ROOT, "docker-compose.yml"))).toBe(true);
  });

  test("ENV_TEMPLATES covers root + every app", () => {
    const targets = ENV_TEMPLATES.map((t) => t.to);
    expect(targets).toEqual([
      ".env",
      "apps/api/.env",
      "apps/collector/.env",
      "apps/web/.env.local",
    ]);

    for (const template of ENV_TEMPLATES) {
      expect(existsSync(path.join(REPO_ROOT, template.from))).toBe(true);
    }
  });

  test("copyEnvIfMissing creates the target when it does not exist", () => {
    const root = makeTempRoot();
    try {
      const template: EnvTemplate = { from: ".env.example", to: ".env" };
      seedSource(root, template, "FOO=bar\n");

      const result = copyEnvIfMissing(template, root, () => {});

      expect(result).toBe("created");
      expect(readFileSync(path.join(root, template.to), "utf8")).toBe("FOO=bar\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("copyEnvIfMissing skips when the target already exists", () => {
    const root = makeTempRoot();
    try {
      const template: EnvTemplate = { from: ".env.example", to: ".env" };
      seedSource(root, template, "NEW=value\n");
      writeFileSync(path.join(root, template.to), "EXISTING=keep\n");

      const result = copyEnvIfMissing(template, root, () => {});

      expect(result).toBe("skipped");
      expect(readFileSync(path.join(root, template.to), "utf8")).toBe("EXISTING=keep\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
