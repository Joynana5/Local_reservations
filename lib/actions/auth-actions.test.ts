import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("../supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth }),
}));

import { logInAction, logOutAction, signUpAction } from "./auth-actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  auth.signUp.mockReset();
  auth.signInWithPassword.mockReset();
  auth.signOut.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("signUpAction", () => {
  it("redirects to setup when sign-up returns a session", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: { access_token: "t" }, user: { id: "u" } },
      error: null,
    });
    await expect(
      signUpAction(
        null,
        form({ email: "a@example.com", password: "12345678" }),
      ),
    ).rejects.toThrow("REDIRECT:/setup");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "12345678",
    });
  });

  it("asks the owner to confirm their email when no session is returned", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null, user: { id: "u" } },
      error: null,
    });
    const state = await signUpAction(
      null,
      form({ email: "a@example.com", password: "12345678" }),
    );
    expect(state).toMatchObject({ ok: true, code: "confirm_email" });
  });

  it("returns a password field error for fewer than 8 characters without calling Supabase", async () => {
    const state = await signUpAction(
      null,
      form({ email: "a@example.com", password: "1234567" }),
    );
    expect(state).toMatchObject({
      ok: false,
      code: "validation",
      fieldErrors: { password: ["Password must be at least 8 characters."] },
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("rejects passwords over 72 UTF-8 bytes before calling Supabase", async () => {
    const state = await signUpAction(
      null,
      form({ email: "a@example.com", password: "é".repeat(37) }),
    );
    expect(state).toMatchObject({
      ok: false,
      code: "validation",
      fieldErrors: { password: ["Password must be 72 bytes or fewer."] },
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("reports an already registered email", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: "user_already_exists", message: "exists" },
    });
    const state = await signUpAction(
      null,
      form({ email: "a@example.com", password: "12345678" }),
    );
    expect(state).toMatchObject({ ok: false, code: "error" });
  });

  it("returns a friendly message when Supabase throws", async () => {
    auth.signUp.mockRejectedValue(new Error("network down secret-detail"));
    const state = await signUpAction(
      null,
      form({ email: "a@example.com", password: "12345678" }),
    );
    expect(state).toEqual({
      ok: false,
      code: "error",
      message: "We couldn't create your account. Please try again.",
    });
  });
});

describe("logInAction", () => {
  it("redirects to the dashboard with correct credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    await expect(
      logInAction(null, form({ email: "a@example.com", password: "pw" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("shows an error and does not redirect with wrong credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials", message: "Invalid login" },
    });
    const state = await logInAction(
      null,
      form({ email: "a@example.com", password: "wrong" }),
    );
    expect(state).toEqual({
      ok: false,
      code: "error",
      message: "Incorrect email or password.",
    });
  });

  it("tells unconfirmed owners to confirm their email", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "email_not_confirmed", message: "x" },
    });
    const state = await logInAction(
      null,
      form({ email: "a@example.com", password: "pw" }),
    );
    expect(state).toMatchObject({
      ok: false,
      message: "Confirm your email before logging in.",
    });
  });

  it("rejects an empty password before calling Supabase", async () => {
    const state = await logInAction(
      null,
      form({ email: "a@example.com", password: "" }),
    );
    expect(state).toMatchObject({ ok: false, code: "validation" });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("logOutAction", () => {
  it("signs out and redirects to login", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await expect(logOutAction()).rejects.toThrow("REDIRECT:/login");
    expect(auth.signOut).toHaveBeenCalledOnce();
  });

  it("returns an error without redirecting when signOut returns an error", async () => {
    auth.signOut.mockResolvedValue({
      error: { code: "unexpected_failure", message: "private details" },
    });
    await expect(logOutAction()).resolves.toEqual({
      ok: false,
      message: "We couldn't log you out. Please try again.",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Logout failed:",
      "unexpected_failure",
    );
  });

  it("returns an error without redirecting when signOut throws", async () => {
    auth.signOut.mockRejectedValue(new Error("network unavailable"));
    await expect(logOutAction()).resolves.toEqual({
      ok: false,
      message: "We couldn't log you out. Please try again.",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Logout failed:",
      "network unavailable",
    );
  });
});
