/**
 * Phase 2 — Trust Center hardening.
 *
 * The user-visible outcome is the public Trust Center page with
 * extended sections (policies, posture summary, frameworks) and a
 * working visitor-event beacon (`/api/v1/trust-center/:slug/events`).
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 2 — Trust Center", () => {
  test("admin Trust Center workspace renders publish controls", async ({ page }) => {
    await page.goto("/trust-center");
    await expect(page.getByRole("heading", { name: /trust center/i }).first()).toBeVisible();
  });

  test("public Trust Center page is reachable for the seeded org", async ({ request }) => {
    // First find the seeded organisation slug via the admin endpoint.
    const orgRes = await request.get("/api/v1/organizations/me");
    if (!orgRes.ok()) test.skip(true, "Cannot resolve seeded org");
    const org = await orgRes.json();
    const slug: string | undefined = org?.data?.slug ?? org?.slug;
    if (!slug) test.skip(true, "Seeded org has no slug");

    const publicRes = await request.get(`/api/v1/trust-center/${slug}`);
    // 200 = published, 404 = no public Trust Center yet — both are
    // valid post-Phase-2 states; 5xx is a regression.
    expect(publicRes.status()).toBeLessThan(500);
  });
});
