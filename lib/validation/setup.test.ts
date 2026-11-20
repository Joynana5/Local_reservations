import { describe, expect, it } from "vitest";
import { openingHourSchema, profileSchema, tableSchema } from "./setup";

describe("profileSchema", () => {
  it("reports every missing required profile field", () => {
    const result = profileSchema.safeParse({
      name: "",
      neighborhood: "Old Harbor",
      cuisine: "",
      address: "",
      description: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      name: ["Enter a restaurant name."],
      cuisine: ["Enter a cuisine."],
      address: ["Enter an address."],
      description: ["Enter a short description."],
    });
  });
});

describe("openingHourSchema", () => {
  it("rejects a closing time before or equal to opening time", () => {
    const result = openingHourSchema.safeParse({
      weekday: 1,
      isClosed: false,
      openTime: "18:00",
      closeTime: "18:00",
    });
    expect(result.success).toBe(false);
  });

  it("allows a closed day without opening and closing times", () => {
    const result = openingHourSchema.safeParse({
      weekday: 1,
      isClosed: true,
      openTime: "",
      closeTime: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("tableSchema", () => {
  it.each([1, 20])("accepts a capacity of %i", (capacity) => {
    expect(tableSchema.safeParse({ label: "Patio", capacity }).success).toBe(
      true,
    );
  });

  it.each([0, 21])("rejects a capacity of %i", (capacity) => {
    expect(tableSchema.safeParse({ label: "Patio", capacity }).success).toBe(
      false,
    );
  });
});
