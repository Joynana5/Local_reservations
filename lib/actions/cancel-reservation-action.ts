"use server";

import { revalidatePath } from "next/cache";
import { cancelReservation } from "../booking/cancel-reservation";
import { supabaseCancelRepository } from "../booking/supabase-repositories";

export type CancelBookingState =
  | { ok: true; alreadyCancelled: boolean }
  | { ok: false; message: string }
  | null;

export async function cancelReservationAction(
  _previousState: CancelBookingState,
  formData: FormData,
): Promise<CancelBookingState> {
  const token = formData.get("token");
  try {
    const result = await cancelReservation(
      supabaseCancelRepository,
      token,
      new Date(),
    );
    if (!result.ok) return { ok: false, message: result.message };
    if (typeof token === "string") {
      revalidatePath(`/bookings/${token}`);
      revalidatePath(`/bookings/${token}/confirmed`);
    }
    return { ok: true, alreadyCancelled: result.data.alreadyCancelled };
  } catch (cause) {
    console.error(
      "Cancelling reservation failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      message:
        "Something went wrong and your booking was not cancelled. Please try again.",
    };
  }
}
