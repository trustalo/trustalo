/**
 * Phase 5 — AI risk + vendor scoring.
 *
 * The user-visible outcome is an advisory banner above the risk
 * matrix and the vendor overview offering an AI-suggested score /
 * tier with Apply / Dismiss / Refine actions and an audit trail.
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 5 — AI scoring & tiering", () => {
  test("risk detail surfaces an AI advisory banner", async ({ page, request }) => {
    const list = await request.get("/api/v1/risks");
    if (!list.ok()) test.skip(true, "Risks endpoint unavailable");
    const body = await list.json();
    const id = body?.data?.[0]?.id ?? body?.[0]?.id;
    if (!id) test.skip(true, "No seeded risks");

    await page.goto(`/risks/${id}`);
    await expect(page.getByText(/ai (suggestion|score|insight)/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("vendor detail surfaces an AI advisory banner", async ({ page, request }) => {
    const list = await request.get("/api/v1/vendors");
    if (!list.ok()) test.skip(true, "Vendors endpoint unavailable");
    const body = await list.json();
    const id = body?.data?.[0]?.id ?? body?.[0]?.id;
    if (!id) test.skip(true, "No seeded vendors");

    await page.goto(`/vendors/${id}`);
    await expect(page.getByText(/ai (suggestion|tier|insight)/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
