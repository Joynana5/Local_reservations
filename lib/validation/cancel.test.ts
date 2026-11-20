import { describe, expect, it } from "vitest";
import { manageTokenSchema } from "./cancel";

describe("manageTokenSchema", () => {
  it("accepts a 64-character lowercase hex token", () => {
    expect(manageTokenSchema.safeParse("a1".repeat(32)).success).toBe(true);
  });

  it.each([
    ["an empty string", ""],
    ["a token that is too short", "abc"],
    ["a token that is too long", "a".repeat(65)],
    ["uppercase hex", "A".repeat(64)],
    ["non-hex characters", "g".repeat(64)],
    ["a token with surrounding whitespace", ` ${"a".repeat(64)} `],
  ])("rejects %s", (_label, token) => {
    expect(manageTokenSchema.safeParse(token).success).toBe(false);
  });
});
