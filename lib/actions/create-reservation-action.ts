"use server";

import { redirect } from "next/navigation";
import {
  createReservation,
  type BookingRepository,
} from "../booking/create-reservation";
import {
  getReservationsForRestaurant,
  getRestaurantWithDetails,
  insertReservation,
} from "../supabase/admin";
import type { BookingFieldErrors } from "../validation/booking";

export type BookingFormState =
  | { ok: false; code: "validation"; fieldErrors: BookingFieldErrors }
  | {
      ok: false;
      code: "slot_taken" | "unavailable";
      message: string;
      alternatives: string[];
    }
  | { ok: false; code: "error"; message: string }
  | null;

const repository: BookingRepository = {
  getRestaurantDetails: async (restaurantId) => {
    const details = await getRestaurantWithDetails(restaurantId);
    return (
      details && {
        restaurant: details.restaurant,
        openingHours: details.openingHours,
        tables: details.tables,
      }
    );
  },
  getActiveReservations: async (restaurantId, from, to) => {
    const reservations = await getReservationsForRestaurant(
      restaurantId,
      from,
      to,
    );
    return reservations.map((reservation) => ({
      tableId: reservation.table_id,
      startsAt: new Date(reservation.starts_at),
      endsAt: new Date(reservation.ends_at),
      status: reservation.status,
    }));
  },
  insertReservation,
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function createReservationAction(
  _previousState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  let manageToken: string;
  try {
    const result = await createReservation(repository, {
      restaurantId: text(formData, "restaurantId"),
      date: text(formData, "date"),
      time: text(formData, "time"),
      partySize: text(formData, "partySize"),
      name: text(formData, "name"),
      phone: text(formData, "phone"),
      email: text(formData, "email"),
    });
    if (!result.ok) return result;
    manageToken = result.data.manageToken;
  } catch (cause) {
    console.error(
      "Creating reservation failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      code: "error",
      message:
        "Something went wrong and your table was not booked. Please try again.",
    };
  }
  redirect(`/bookings/${manageToken}/confirmed`);
}
