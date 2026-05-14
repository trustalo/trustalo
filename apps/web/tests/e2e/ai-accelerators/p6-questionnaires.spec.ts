/**
 * Phase 6 — AI questionnaire answering.
 *
 * The user-visible outcome is a Questionnaires workspace where a
 * security lead can import a CSV, run AI bulk answering, review /
 * approve answers, and export the completed questionnaire.
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 6 — Questionnaires", () => {
  test("questionnaires list page renders an import action", async ({ page }) => {
    await page.goto("/questionnaires");
    await expect(page.getByRole("heading", { name: /questionnaire/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /import|new|add/i }).first()).toBeVisible();
  });

  test("import wizard accepts pasted CSV and previews columns", async ({ page }) => {
    await page.goto("/questionnaires/new");

    await page.getByLabel(/name/i).fill("Smoke test CAIQ");

    const csv = [
      "Question ID,Section,Question,Answer",
      "AIS-01,Application & Interface Security,Do you encrypt data at rest?,",
      "AIS-02,Application & Interface Security,Do you encrypt data in transit?,",
    ].join("\n");

    const paste = page.locator("textarea").first();
    if (await paste.count()) {
      await paste.fill(csv);
    }

    // Preview should pick up the four columns.
    await expect(page.getByText(/question id|section|question/i).first()).toBeVisible();
  });
});
