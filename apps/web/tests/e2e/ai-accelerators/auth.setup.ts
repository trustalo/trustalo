/**
 * Sign-in setup for the AI accelerators smoke suite. Persists an
 * authenticated browser state so the spec files start logged in.
 *
 * Defaults match the seeded local test user (`apps/api/prisma/seed.ts`).
 */

import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const EMAIL = process.env.PLAYWRIGHT_USER_EMAIL ?? "test@test.com";
const PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD ?? "test.test";

const STATE = path.join(__dirname, ".auth", "user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Land on the dashboard once auth succeeds.
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /dashboard|overview/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: STATE });
});
