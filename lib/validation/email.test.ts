import { describe, expect, it } from "vitest";
import { confirmationEmailSchema, emailEnvSchema } from "./email";

describe("emailEnvSchema", () => {
  it("applies the Resend test sender and localhost URL when optional settings are empty", () => {
    expect(
      emailEnvSchema.parse({
        RESEND_API_KEY: "re_123",
        EMAIL_FROM: "",
        NEXT_PUBLIC_SITE_URL: "",
      }),
    ).toEqual({
      RESEND_API_KEY: "re_123",
      EMAIL_FROM: "TableNook <onboarding@resend.dev>",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });
  });

  it("rejects a missing or malformed API key", () => {
    expect(emailEnvSchema.safeParse({}).success).toBe(false);
    expect(emailEnvSchema.safeParse({ RESEND_API_KEY: "abc" }).success).toBe(
      false,
    );
  });

  it("rejects a site URL that is not a full URL", () => {
    expect(
      emailEnvSchema.safeParse({
        RESEND_API_KEY: "re_123",
        NEXT_PUBLIC_SITE_URL: "tablenook",
      }).success,
    ).toBe(false);
  });
});

describe("confirmationEmailSchema", () => {
  const valid = {
    reservationId: "res-1",
    to: "maya@example.com",
    guestName: "Maya Brooks",
    restaurantName: "Nonna Rosa's",
    startsAt: new Date("2026-11-08T02:00:00Z"),
    partySize: 2,
    manageToken: "0123456789abcdef".repeat(4),
  };

  it("accepts a valid confirmation", () => {
    expect(confirmationEmailSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a short, guessable manage token", () => {
    expect(
      confirmationEmailSchema.safeParse({ ...valid, manageToken: "token-1" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid email address and a party outside 1-20", () => {
    expect(
      confirmationEmailSchema.safeParse({ ...valid, to: "maya@" }).success,
    ).toBe(false);
    expect(
      confirmationEmailSchema.safeParse({ ...valid, partySize: 21 }).success,
    ).toBe(false);
  });
});
