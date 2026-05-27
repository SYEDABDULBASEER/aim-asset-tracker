import { expect, test } from "@playwright/test";

test.describe("employee portal", () => {
  test("portal home explains local identity", async ({ page }) => {
    await page.goto("/user");
    await expect(page.getByText(/stored on this device only/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("request support page shows step copy", async ({ page }) => {
    await page.goto("/user/request-support");
    await expect(page.getByRole("heading", { name: /report an issue/i })).toBeVisible();
    await expect(page.getByText(/confirm who you are/i)).toBeVisible();
  });
});
