import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("signupSchema", () => {
  it("accepts a valid email and an 8-character password", () => {
    const result = signupSchema.safeParse({
      email: "owner@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("trims the email", () => {
    const result = signupSchema.safeParse({
      email: "  owner@example.com ",
      password: "12345678",
    });
    expect(result.success && result.data.email).toBe("owner@example.com");
  });

  it("rejects a 7-character password with a clear message", () => {
    const result = signupSchema.safeParse({
      email: "owner@example.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toEqual([
      "Password must be at least 8 characters.",
    ]);
  });

  it("rejects a password longer than 72 characters", () => {
    const result = signupSchema.safeParse({
      email: "owner@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "12345678",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password so wrong credentials reach Supabase", () => {
    const result = loginSchema.safeParse({
      email: "owner@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "owner@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toEqual([
      "Enter your password.",
    ]);
  });

  it("rejects a missing email", () => {
    const result = loginSchema.safeParse({ email: "", password: "x" });
    expect(result.success).toBe(false);
  });
});
