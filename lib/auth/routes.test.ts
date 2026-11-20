import { describe, expect, it } from "vitest";
import { isAuthPagePath, isProtectedPath } from "./routes";

describe("isProtectedPath", () => {
  it.each(["/dashboard", "/dashboard/waitlist", "/setup", "/setup/tables"])(
    "protects %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it.each([
    "/",
    "/login",
    "/signup",
    "/search",
    "/restaurants/1",
    "/dashboards",
    "/setup-guide",
  ])("leaves %s public", (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});

describe("isAuthPagePath", () => {
  it("matches login and signup only", () => {
    expect(isAuthPagePath("/login")).toBe(true);
    expect(isAuthPagePath("/signup")).toBe(true);
    expect(isAuthPagePath("/dashboard")).toBe(false);
  });
});
