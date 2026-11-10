import { expect, test } from "@playwright/test";

test("search shows loading, seeded matching restaurants, and the empty state", async ({ page }) => {
  await page.goto("/search");
  const dateInput = page.getByLabel("Date");
  await expect(dateInput).not.toHaveValue("");
  const today = await dateInput.inputValue();
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  await dateInput.fill(tomorrow.toISOString().slice(0, 10));
  await page.getByLabel("Time").selectOption("12:00");
  await page.getByLabel("Neighborhood").selectOption("Old Harbor");

  await page.route("**/search", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 750));
    await route.continue();
  });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Searching for available tables...");
  await expect(page.getByText("No restaurants found matching your criteria.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tidewater Taqueria" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Riverbend Café" })).toHaveCount(0);

  await page.getByLabel("Party Size").selectOption("20");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No restaurants found matching your criteria.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Try another time or neighborhood.")).toBeVisible();
});

test("a failed request is shown as an error, not an empty result", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByLabel("Date")).not.toHaveValue("");
  await page.route("**/search", async (route) => {
    if (route.request().method() === "POST") await route.abort();
    else await route.continue();
  });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Search failed");
  await expect(page.getByText("No restaurants found matching your criteria.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeEnabled();
});
