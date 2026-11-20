import { expect, test } from "@playwright/test";

test("logged-out visitors to /dashboard are redirected to the login page", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "TableNook for restaurants" }),
  ).toBeVisible();
});

test("logged-out visitors to /setup are redirected to the login page", async ({
  page,
}) => {
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login$/);
});

test("the restaurant header and Log in / Sign up tabs are shown", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByText("Restaurant", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Guest site" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Log in" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("tab", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("tab", { name: "Sign up" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeVisible();
});

test("sign-up with a short password shows an inline error and stays on the page", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Password must be at least 8 characters."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("wrong credentials show an error and stay on the login page", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody-e2e@example.com");
  await page.getByLabel("Password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

// Needs a pre-created owner account (email confirmation off or confirmed account).
const email = process.env.E2E_OWNER_EMAIL;
const password = process.env.E2E_OWNER_PASSWORD;

test("owner logs in, sees the dashboard, logs out and is redirected from /dashboard", async ({
  page,
}) => {
  test.skip(!email || !password, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
