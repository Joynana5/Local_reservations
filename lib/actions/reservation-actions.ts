"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "../supabase/server";

const reservationStatusSchema = z.enum([
  "confirmed",
  "seated",
  "no_show",
  "cancelled",
]);

export type ReservationStatusActionState =
  | { ok: true }
  | { ok: false; message: string };

export async function changeReservationStatusAction(
  reservationId: string,
  status: string,
): Promise<ReservationStatusActionState> {
  const parsed = z.object({
    reservationId: z.uuid(),
    status: reservationStatusSchema,
  }).safeParse({ reservationId, status });
  if (!parsed.success) {
    return { ok: false, message: "That reservation status is invalid." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Please log in again." };

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return { ok: false, message: "Set up your restaurant first." };

    const { error } = await supabase
      .from("reservations")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.reservationId)
      .eq("restaurant_id", restaurant.id);
    if (error) throw error;

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (cause) {
    console.error(
      "Changing reservation status failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return { ok: false, message: "We couldn't update that reservation." };
  }
}
