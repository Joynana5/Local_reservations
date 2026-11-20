"use client";

import { useActionState, useState } from "react";
import {
  cancelReservationAction,
  type CancelBookingState,
} from "@/lib/actions/cancel-reservation-action";
import { Button } from "@/components/ui/button";

export function CancelBookingForm({ token }: { token: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<
    CancelBookingState,
    FormData
  >(cancelReservationAction, null);

  return (
    <div className="mt-6">
      <div aria-live="polite">
        {state && !state.ok && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-danger p-4 text-danger"
          >
            {state.message}
          </p>
        )}
      </div>
      {confirming ? (
        <form
          action={formAction}
          role="group"
          aria-labelledby="cancel-confirm-title"
          className="rounded-xl border border-danger bg-white p-5"
        >
          <input type="hidden" name="token" value={token} />
          <p id="cancel-confirm-title" className="font-bold">
            Cancel this reservation?
          </p>
          <p className="mt-1 text-muted">
            Your table will be released for other guests.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Cancelling…" : "Yes, cancel booking"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Keep booking
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Cancel booking
        </Button>
      )}
    </div>
  );
}
