/**
 * Phase 1 — AI policy generation.
 *
 * The user-visible outcome is: a security lead can capture
 * organisation context once, then on any policy hit "AI draft" and
 * see a structured proposal in a diff modal that they can accept
 * or reject.
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 1 — AI policy generation", () => {
  test("organization context wizard is reachable", async ({ page }) => {
    await page.goto("/settings/ai-context");

    // Wizard heading + at least one input for organisation facts.
    await expect(
      page.getByRole("heading", { name: /context|organization|company/i }).first(),
    ).toBeVisible();
    await expect(page.locator("textarea, input[type=text]").first()).toBeVisible();
  });

  test("policy detail surfaces an AI draft action", async ({ page }) => {
    await page.goto("/policies");
    // Pick the first policy in the list (seed creates several).
    const firstPolicyLink = page.locator("a[href^='/policies/']").first();
    if (!(await firstPolicyLink.count())) {
      test.skip(true, "No seeded policies present — skip");
    }
    await firstPolicyLink.click();

    await expect(
      page.getByRole("button", { name: /ai (draft|generate|suggest)/i }).first(),
    ).toBeVisible();
  });
});
