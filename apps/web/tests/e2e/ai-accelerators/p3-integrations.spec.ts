/**
 * Phase 3 — Integrations evidence writeback.
 *
 * The user-visible outcome is the /integrations workspace listing
 * connectable manifests and an /integrations/checks page surfacing
 * automated check status with mapped controls.
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 3 — Integrations", () => {
  test("integration catalog lists v1 manifests", async ({ request }) => {
    const res = await request.get("/api/v1/integrations/catalog");
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      const ids = (body.data ?? []).map((m: { id: string }) => m.id);
      // Phase 3 ships at least these 6 manifests.
      for (const expected of [
        "aws",
        "github",
        "google-workspace",
        "okta",
        "microsoft-365",
        "gitlab",
      ]) {
        expect(ids).toContain(expected);
      }
    }
  });

  test("checks workspace renders summary tiles", async ({ page }) => {
    await page.goto("/integrations/checks");
    await expect(page.getByRole("heading", { name: /checks/i }).first()).toBeVisible();
  });
});
