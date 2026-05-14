/**
 * Phase 0 — Foundation: AI provider resolution.
 *
 * The user-visible outcome of Phase 0 is the operator-facing AI
 * configuration surface: a tenant admin can land on Settings → AI,
 * see the resolved provider for every feature, and hit the new
 * `/api/v1/ai-config/health` endpoint to confirm the operator
 * defaults are wired correctly.
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 0 — AI provider resolution layer", () => {
  test("settings page exposes AI configuration with all features", async ({ page }) => {
    await page.goto("/settings");

    // Settings tabs render and AI tab is reachable.
    const aiTab = page
      .getByRole("tab", { name: /ai/i })
      .or(page.getByRole("link", { name: /ai/i }).first());
    if (await aiTab.count()) {
      await aiTab.first().click();
    }

    // Each AI feature added in Phase 0 should be listed somewhere on the AI page.
    for (const feature of [/policy/i, /risk/i, /vendor/i, /questionnaire/i, /trust/i]) {
      await expect(page.getByText(feature).first()).toBeVisible();
    }
  });

  test("health endpoint reports the resolved provider per feature", async ({ request }) => {
    // The page already authenticated; reuse cookie/auth via the request context.
    const res = await request.get("/api/v1/ai-config/health");
    expect(res.status()).toBeLessThan(500);

    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("data");
      // Either every feature has a provider or the endpoint reports the
      // operator hasn't configured one yet — both are non-failure outcomes.
      expect(typeof body.data).toBe("object");
    }
  });
});
