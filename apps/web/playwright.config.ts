/**
 * Playwright config for the AI accelerators smoke suite.
 *
 * The suite under tests/e2e/ai-accelerators/ exercises the
 * user-visible outcome of every AI accelerator surface (policy
 * drafting, integrations + automated checks, NL check generation,
 * risk + vendor scoring, questionnaires). The suite assumes a
 * running stack:
 *   - API on http://localhost:4000 (apps/api)
 *   - Web on http://localhost:3000 (this app)
 *   - PostgreSQL + LocalStack via docker compose
 *   - Database seeded via `bun apps/api/prisma/seed.ts`
 *
 * Tests sign in once via storageState (see
 * tests/e2e/ai-accelerators/auth.setup.ts) to keep run-time tight.
 * Provide credentials with PLAYWRIGHT_USER_EMAIL +
 * PLAYWRIGHT_USER_PASSWORD; defaults match the seeded test user.
 */

import { defineConfig, devices } from "@playwright/test";

const WEB_URL = process.env.PLAYWRIGHT_WEB_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // Tenant data is shared across specs.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /ai-accelerators\/auth\.setup\.ts/,
    },
    {
      name: "ai-accelerators",
      testMatch: /ai-accelerators\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/ai-accelerators/.auth/user.json",
      },
    },
  ],
});
