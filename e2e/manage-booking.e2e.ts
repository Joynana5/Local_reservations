import { expect, test } from "@playwright/test";

// Tidewater Taqueria (seed data) is open every day 11:30-21:00 and has a single 6-seat table.
const restaurantId = "00000000-0000-0000-0000-000000000002";

function dateInDays(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

test("a manage link with an unknown token shows an error and no reservation details", async ({
  page,
}) => {
  await page.goto(`/bookings/${"0".repeat(64)}`);
  await expect(page.getByText("We couldn't find this booking")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Reservation details" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cancel booking" }),
  ).toHaveCount(0);
});

test("a manage link with a malformed token shows an error and no reservation details", async ({
  page,
}) => {
  await page.goto("/bookings/not-a-real-token");
  await expect(page.getByText("We couldn't find this booking")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Reservation details" }),
  ).toHaveCount(0);
});

// Creates and cancels a real reservation in the connected Supabase project, so it is opt-in.
test("a guest cancels a booking from the manage link and the slot is free again", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_ALLOW_BOOKING_WRITES,
    "Set E2E_ALLOW_BOOKING_WRITES=1 to create a demo reservation.",
  );

  const date = dateInDays(27);
  const restaurantUrl = `/restaurants/${restaurantId}?date=${date}&party=6`;
  await page.goto(restaurantUrl);
  const firstSlot = page.locator("ul li").first();
  await expect(firstSlot).toContainText("Free");
  await firstSlot.getByRole("link").click();
  await page.getByLabel("Name").fill("E2E Guest");
  await page.getByLabel("Phone").fill("(555) 234-5678");
  await page.getByLabel("Email").fill("e2e-guest@example.com");
  await page.getByRole("button", { name: "Book table" }).click();
  await expect(page).toHaveURL(/\/bookings\/([0-9a-f]{64})\/confirmed/, {
    timeout: 30_000,
  });
  const token = /\/bookings\/([0-9a-f]{64})\//.exec(page.url())![1];

  await page.goto(restaurantUrl);
  await expect(page.locator("ul li").first()).toContainText("Booked");

  await page.goto(`/bookings/${token}`);
  const details = page.getByRole("region", { name: "Reservation details" });
  await expect(details.getByText("Tidewater Taqueria")).toBeVisible();
  await expect(details.getByText("Table confirmed")).toBeVisible();

  await page.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("button", { name: "Keep booking" }).click();
  await expect(details.getByText("Table confirmed")).toBeVisible();

  await page.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("button", { name: "Yes, cancel booking" }).click();
  await expect(
    page.getByRole("heading", { name: "Booking cancelled" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(details.getByText("Cancelled")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel booking" }),
  ).toHaveCount(0);

  await page.goto(restaurantUrl);
  await expect(page.locator("ul li").first()).toContainText("Free");
});
