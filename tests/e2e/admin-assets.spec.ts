import { expect, test } from "@playwright/test";

test.describe("IT admin (demo mode)", () => {
  test("assets list loads without Firebase", async ({ page }) => {
    await page.goto("/admin/assets");
    await expect(page.getByRole("heading", { name: /assets/i })).toBeVisible({ timeout: 15_000 });
    const table = page.locator("table");
    const empty = page.getByText(/no assets/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 15_000 });
  });

  test("dashboard overview loads in demo mode", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /it operations overview/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
