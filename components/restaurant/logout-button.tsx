"use client";

import { useActionState } from "react";
import { logOutAction, type LogoutFormState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [state, formAction, pending] = useActionState<
    LogoutFormState,
    FormData
  >(logOutAction, null);

  return (
    <form action={formAction} className="relative">
      <Button
        type="submit"
        variant="secondary"
        className="px-4 py-1.5"
        disabled={pending}
      >
        {pending ? "Logging out…" : "Log out"}
      </Button>
      {state && (
        <p
          role="alert"
          className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-danger bg-white p-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
