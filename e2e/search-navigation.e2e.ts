import { expect, test } from "@playwright/test";

test("Search Now opens the search page with a date selected", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.getByRole("link", { name: "Search Now" }).click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("heading", { name: "Find Your Table" })).toBeVisible();
  await expect(page.locator('input[type="date"]')).not.toHaveValue("");
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Find Your Table" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the search page renders after navigation without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();

  await page.goto("/");
  const [response] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/search")),
    page.getByRole("link", { name: "Search Now" }).click(),
  ]);

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("heading", { name: "Find Your Table" })).toBeVisible();
  expect(await response.text()).toContain("Enable JavaScript to search for restaurant availability.");
  await context.close();
});
