import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("shows chooser and IT path links to login with redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /assetsphere/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /employee portal/i })).toBeVisible();
    const itLink = page.getByRole("link", { name: /it admin workspace/i });
    await expect(itLink).toBeVisible();
    await itLink.click();
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toMatch(/redirect=%2Fadmin/);
  });
});
