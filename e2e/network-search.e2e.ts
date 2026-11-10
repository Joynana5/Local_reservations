import { networkInterfaces } from "node:os";
import { expect, test } from "@playwright/test";

test("the search form initializes and submits via the network address", async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), "This test requires the locally managed development server.");
  const address = Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .find((item) => item.family === "IPv4" && !item.internal)?.address;
  test.skip(!address, "No network IPv4 address is available.");

  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });

  await page.goto(`http://${address}:3101/search`);
  const date = page.getByLabel("Date");
  await expect(date).not.toHaveValue("");
  const search = page.getByRole("button", { name: "Search", exact: true });
  await expect(search).toBeEnabled();
  await page.getByLabel("Party Size").selectOption("20");
  await search.click();
  await expect(page.getByText("No restaurants found matching your criteria."))
    .toBeVisible({ timeout: 30_000 });
  expect(failures).toEqual([]);
});
