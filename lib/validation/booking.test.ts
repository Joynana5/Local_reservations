import { describe, expect, it } from "vitest";
import { bookingSchema, normalizePhone } from "./booking";

const valid = {
  restaurantId: "00000000-0000-0000-0000-000000000001",
  date: "2026-11-07",
  time: "18:00",
  partySize: "2",
  name: "  Maya Brooks ",
  phone: "(555) 234-5678",
  email: " maya@example.com ",
};

describe("phone normalization", () => {
  it.each([
    ["(555) 234-5678", "+15552345678"],
    ["555-234-5678", "+15552345678"],
    ["555.234.5678", "+15552345678"],
    ["5552345678", "+15552345678"],
    ["+1 555 234 5678", "+15552345678"],
    ["1-555-234-5678", "+15552345678"],
  ])("accepts %s and stores %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "",
    "abc",
    "12345",
    "555-0101",
    "555 234 567",
    "555 234 56789",
    "+44 20 7946 0958",
    "+555 234 5678",
    "(055) 234-5678",
    "555-134-5678",
    "555-234-5678 ext 2",
    "5552345678+",
  ])("rejects %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("booking schema", () => {
  it("accepts a valid booking, trims text and normalizes the phone number", () => {
    const parsed = bookingSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({
      name: "Maya Brooks",
      email: "maya@example.com",
      phone: "+15552345678",
      partySize: 2,
    });
  });

  it("accepts the non-RFC demo restaurant ids", () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
  });

  it("returns an inline phone error for an invalid phone number", () => {
    const parsed = bookingSchema.safeParse({ ...valid, phone: "12345" });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.phone).toEqual([
      "Enter a valid 10-digit phone number, e.g. (555) 123-4567.",
    ]);
  });

  it.each([
    "maya",
    "maya@",
    "@example.com",
    "maya@example",
    "maya example@x.com",
  ])("returns an inline email error for %j", (email) => {
    const parsed = bookingSchema.safeParse({ ...valid, email });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.email).toHaveLength(1);
  });

  it("requires a name", () => {
    expect(
      bookingSchema.safeParse({ ...valid, name: "   " }).error?.flatten()
        .fieldErrors.name,
    ).toEqual(["Enter your name."]);
  });

  it.each(["0", "21", "1.5", "two", ""])(
    "rejects party size %j",
    (partySize) => {
      expect(bookingSchema.safeParse({ ...valid, partySize }).success).toBe(
        false,
      );
    },
  );

  it.each([
    ["date", "07/11/2026"],
    ["time", "18:15"],
    ["restaurantId", "not-an-id"],
  ])("rejects an invalid %s", (field, value) => {
    expect(bookingSchema.safeParse({ ...valid, [field]: value }).success).toBe(
      false,
    );
  });
});
