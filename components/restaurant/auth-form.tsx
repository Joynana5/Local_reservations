"use client";

import { useActionState, useState } from "react";
import {
  logInAction,
  signUpAction,
  type AuthFormState,
} from "@/lib/actions/auth-actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    isSignup ? signUpAction : logInAction,
    null,
  );
  // Controlled, because React resets uncontrolled fields after every form action
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fieldErrors = state?.code === "validation" ? state.fieldErrors : {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email?.[0]}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        required
        minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        hint={
          isSignup ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined
        }
        error={fieldErrors.password?.[0]}
      />

      <div aria-live="polite">
        {state?.code === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-danger bg-white p-3 text-sm font-bold text-danger"
          >
            {state.message}
          </p>
        )}
        {state?.code === "confirm_email" && (
          <p className="rounded-lg border border-accent bg-accent/20 p-3 text-sm">
            <span className="font-bold">Check your email.</span> {state.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? isSignup
            ? "Creating account…"
            : "Logging in…"
          : isSignup
            ? "Create account"
            : "Log in"}
      </Button>
    </form>
  );
}
