import { expect, test, type Page } from "@playwright/test";

// Tidewater Taqueria (seed data) is open every day 11:30-21:00 and has a table for 2.
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

async function openFirstFreeSlot(page: Page, date: string) {
  await page.goto(`/restaurants/${restaurantId}?date=${date}&party=2`);
  await expect(
    page.getByRole("heading", { name: "Tidewater Taqueria" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Free/ }).first().click();
  await expect(
    page.getByRole("heading", { name: "Book a table" }),
  ).toBeVisible();
}

test("an invalid phone or email shows inline errors and nothing is booked", async ({
  page,
}) => {
  await openFirstFreeSlot(page, dateInDays(20));

  await page.getByLabel("Name").fill("E2E Guest");
  await page.getByLabel("Phone").fill("12345");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Book table" }).click();

  await expect(
    page.getByText("Enter a valid 10-digit phone number, e.g. (555) 123-4567."),
  ).toBeVisible();
  await expect(
    page.getByText("Enter a valid email address, e.g. name@example.com."),
  ).toBeVisible();
  await expect(page.getByLabel("Phone")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Phone")).toHaveAttribute(
    "aria-describedby",
    /field-phone-error/,
  );
  await expect(page.getByLabel("Name")).toHaveValue("E2E Guest");
  await expect(page).toHaveURL(/\/book\?/);
});

test("changing the party size on the restaurant page reloads the times without a button", async ({
  page,
}) => {
  const date = dateInDays(21);
  await page.goto(`/restaurants/${restaurantId}?date=${date}&party=2`);
  await expect(
    page.getByRole("link", { name: /Free/ }).first(),
  ).toHaveAttribute("href", /party=2/);

  await page.getByLabel("Party size").selectOption("6");
  await expect(page).toHaveURL(/party=6/);
  await expect(
    page.getByRole("link", { name: /Free/ }).first(),
  ).toHaveAttribute("href", /party=6/);

  // Tidewater's largest table seats 6
  await page.getByLabel("Party size").selectOption("7");
  await expect(page.getByText("No table fits a party of 7")).toBeVisible();
});

test("the booking page asks for a time when the link has none", async ({
  page,
}) => {
  await page.goto(`/restaurants/${restaurantId}/book`);
  await expect(page.getByText("Choose a time first")).toBeVisible();
});

test("a booking link with an unknown token shows an error and no data", async ({
  page,
}) => {
  await page.goto(`/bookings/${"0".repeat(64)}/confirmed`);
  await expect(page.getByText("We couldn't find this booking")).toBeVisible();
});

// Creates a real reservation in the connected Supabase project, so it is opt-in.
test("a guest books a table and sees the confirmation", async ({ page }) => {
  test.skip(
    !process.env.E2E_ALLOW_BOOKING_WRITES,
    "Set E2E_ALLOW_BOOKING_WRITES=1 to create a demo reservation.",
  );

  await openFirstFreeSlot(page, dateInDays(25));
  await page.getByLabel("Name").fill("E2E Guest");
  await page.getByLabel("Phone").fill("(555) 234-5678");
  await page.getByLabel("Email").fill("e2e-guest@example.com");
  await page.getByRole("button", { name: "Book table" }).click();

  await expect(page).toHaveURL(/\/bookings\/[0-9a-f]{64}\/confirmed/, {
    timeout: 30_000,
  });
  const details = page.getByRole("region", { name: "Reservation details" });
  await expect(details.getByText("Table confirmed")).toBeVisible();
  await expect(details.getByText("Tidewater Taqueria")).toBeVisible();
  await expect(page.getByText(/e2e-guest@example.com/)).toBeVisible();
});

// Tidewater has a single 6-seat table, so one booking makes that slot unavailable for a party of 6.
test("going back to the restaurant page shows the slot just booked as booked", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_ALLOW_BOOKING_WRITES,
    "Set E2E_ALLOW_BOOKING_WRITES=1 to create a demo reservation.",
  );

  await page.goto(
    `/restaurants/${restaurantId}?date=${dateInDays(26)}&party=6`,
  );
  const firstSlot = page.locator("ul li").first();
  await expect(firstSlot).toContainText("Free");
  await firstSlot.getByRole("link").click();
  await page.getByLabel("Name").fill("E2E Guest");
  await page.getByLabel("Phone").fill("(555) 234-5678");
  await page.getByLabel("Email").fill("e2e-guest@example.com");
  await page.getByRole("button", { name: "Book table" }).click();
  await expect(page).toHaveURL(/\/confirmed/, { timeout: 30_000 });

  await page.goBack();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Pick a time" }),
  ).toBeVisible();
  await expect(page.locator("ul li").first()).toContainText("Booked");
});
