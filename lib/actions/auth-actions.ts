"use server";

import { redirect } from "next/navigation";
import { DASHBOARD_PATH, LOGIN_PATH, SETUP_PATH } from "../auth/routes";
import { createServerSupabaseClient } from "../supabase/server";
import {
  loginSchema,
  signupSchema,
  type AuthFieldErrors,
} from "../validation/auth";

export type AuthFormState =
  | { ok: false; code: "validation"; fieldErrors: AuthFieldErrors }
  | { ok: false; code: "error"; message: string }
  | { ok: true; code: "confirm_email"; message: string }
  | null;

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const serverError = (message: string): AuthFormState => ({
  ok: false,
  code: "error",
  message,
});

export async function signUpAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let hasSession: boolean;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp(parsed.data);
    if (error) {
      if (error.code === "user_already_exists") {
        return serverError(
          "An account with this email already exists. Log in instead.",
        );
      }
      if (error.code === "weak_password") {
        return {
          ok: false,
          code: "validation",
          fieldErrors: { password: [error.message] },
        };
      }
      console.error("Sign-up failed:", error.code ?? error.message);
      return serverError("We couldn't create your account. Please try again.");
    }
    hasSession = data.session !== null;
  } catch (cause) {
    console.error(
      "Sign-up failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return serverError("We couldn't create your account. Please try again.");
  }

  if (!hasSession) {
    return {
      ok: true,
      code: "confirm_email",
      message: `We sent a confirmation link to ${parsed.data.email}. Open it, then log in.`,
    };
  }
  redirect(SETUP_PATH);
}

export async function logInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      if (error.code === "email_not_confirmed") {
        return serverError("Confirm your email before logging in.");
      }
      if (error.code === "invalid_credentials") {
        return serverError("Incorrect email or password.");
      }
      console.error("Login failed:", error.code ?? error.message);
      return serverError("We couldn't log you in. Please try again.");
    }
  } catch (cause) {
    console.error(
      "Login failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return serverError("We couldn't log you in. Please try again.");
  }

  redirect(DASHBOARD_PATH);
}

export async function logOutAction(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (cause) {
    console.error(
      "Logout failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }
  redirect(LOGIN_PATH);
}
