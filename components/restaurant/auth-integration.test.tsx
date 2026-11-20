// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSignedInUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/session", () => ({ getSignedInUser }));
vi.mock("@/lib/actions/auth-actions", () => ({
  logOutAction: vi.fn(),
  logInAction: vi.fn(),
  signUpAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

import { AuthScreen } from "./auth-screen";
import { HeaderActions } from "./header-actions";
import { SiteHeader } from "@/components/ui/site-header";

beforeEach(() => getSignedInUser.mockReset());
afterEach(cleanup);

describe("restaurant auth integration", () => {
  it("renders logout inside main's restaurant header for a signed-in user", async () => {
    getSignedInUser.mockResolvedValue({ id: "owner" });
    const actions = await HeaderActions();
    render(<SiteHeader variant="restaurant" actions={actions} />);

    const header = screen.getByRole("banner");
    expect(within(header).getByRole("button", { name: "Log out" })).toBeTruthy();
    expect(within(header).getByRole("link", { name: "Guest site" }).getAttribute("href")).toBe("/");
  });

  it("does not render logout for a signed-out user", async () => {
    getSignedInUser.mockResolvedValue(null);
    const actions = await HeaderActions();
    render(<SiteHeader variant="restaurant" actions={actions} />);
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it.each(["login", "signup"] as const)(
    "shows the %s tab selected and links to both auth pages",
    async (mode) => {
      getSignedInUser.mockResolvedValue(null);
      render(await AuthScreen({ mode }));
      const login = screen.getByRole("tab", { name: "Log in" });
      const signup = screen.getByRole("tab", { name: "Sign up" });
      expect(login.getAttribute("href")).toBe("/login");
      expect(signup.getAttribute("href")).toBe("/signup");
      expect(login.getAttribute("aria-selected")).toBe(String(mode === "login"));
      expect(signup.getAttribute("aria-selected")).toBe(String(mode === "signup"));
    },
  );

  it.each(["login", "signup"] as const)(
    "redirects a signed-in user from %s to the dashboard",
    async (mode) => {
      getSignedInUser.mockResolvedValue({ id: "owner" });
      await expect(AuthScreen({ mode })).rejects.toThrow("REDIRECT:/dashboard");
    },
  );
});
