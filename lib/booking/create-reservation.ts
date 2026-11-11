import { z } from "zod";
import {
  fitsBeforeClosing,
  getAlternativeSlots,
  getAvailableSlots,
  HOLD_MINUTES,
  pickTables,
  type Reservation,
  type Table,
} from "../availability";
import { getMapleBayInstant, getMapleBaySlot } from "../search-time";
import { bookingSchema, type BookingFieldErrors } from "../validation/booking";

const HOLD_MS = HOLD_MINUTES * 60_000;

export interface BookingRestaurantDetails {
  restaurant: { id: string; name: string };
  openingHours: Array<{
    weekday: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  tables: Table[];
}

export interface NewReservation {
  restaurantId: string;
  tableId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number;
  startsAt: Date;
  endsAt: Date;
}

export type InsertReservationResult =
  | { kind: "created"; reservationId: string; manageToken: string }
  | { kind: "overlap" }; // the no_double_booking constraint refused the row (SQLSTATE 23P01)

export interface BookingRepository {
  getRestaurantDetails(
    restaurantId: string,
  ): Promise<BookingRestaurantDetails | null>;
  getActiveReservations(
    restaurantId: string,
    from: Date,
    to: Date,
  ): Promise<Reservation[]>;
  insertReservation(
    reservation: NewReservation,
  ): Promise<InsertReservationResult>;
}

export interface CreatedBooking {
  reservationId: string;
  manageToken: string;
  // Details for the confirmation email (FR-8)
  restaurantName: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  startsAt: Date;
}

export type BookingResult =
  | { ok: true; data: CreatedBooking }
  | { ok: false; code: "validation"; fieldErrors: BookingFieldErrors }
  | {
      ok: false;
      code: "slot_taken" | "unavailable";
      message: string;
      alternatives: string[];
    };

const slotTakenMessage = "This time is no longer available.";

export async function createReservation(
  repository: BookingRepository,
  input: unknown,
  now: Date = new Date(),
): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const booking = parsed.data;

  let slot: { startsAt: Date; weekday: number };
  try {
    slot = getMapleBaySlot(booking.date, booking.time);
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Choose a valid time slot.";
    return { ok: false, code: "validation", fieldErrors: { time: [message] } };
  }
  const startsAt = slot.startsAt;
  const endsAt = new Date(startsAt.getTime() + HOLD_MS);

  if (startsAt <= now) {
    return unavailable("That time has already passed. Choose a later time.");
  }

  const details = await repository.getRestaurantDetails(booking.restaurantId);
  if (!details) {
    return unavailable("We couldn't find that restaurant.");
  }

  const hours = details.openingHours.find(
    (item) => item.weekday === slot.weekday,
  );
  if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
    return unavailable("The restaurant is closed on this day.");
  }
  const openTime = hours.open_time.slice(0, 5);
  const closeTime = hours.close_time.slice(0, 5);
  const openAt = getMapleBayInstant(booking.date, openTime).startsAt;
  const closeAt = getMapleBayInstant(booking.date, closeTime).startsAt;

  if (!details.tables.some((table) => table.capacity >= booking.partySize)) {
    return unavailable("No table is large enough for your party.");
  }

  const findAlternatives = async () => {
    const dayReservations = await repository.getActiveReservations(
      booking.restaurantId,
      openAt,
      new Date(closeAt.getTime() + HOLD_MS),
    );
    const slots = getAvailableSlots(
      booking.date,
      openTime,
      closeTime,
      booking.partySize,
      details.tables,
      dayReservations,
    ).filter((isoSlot) => new Date(isoSlot) > now);
    return getAlternativeSlots(startsAt, slots);
  };

  if (startsAt < openAt || !fitsBeforeClosing(startsAt, closeAt)) {
    return {
      ok: false,
      code: "unavailable",
      message: "That time is outside the restaurant's booking hours.",
      alternatives: await findAlternatives(),
    };
  }

  // Re-check against the latest reservations before saving (FR-7).
  const nearby = await repository.getActiveReservations(
    booking.restaurantId,
    new Date(startsAt.getTime() - HOLD_MS),
    endsAt,
  );
  const candidates = pickTables(
    startsAt,
    booking.partySize,
    details.tables,
    nearby,
  );

  // The DB constraint is per table: if another guest takes a candidate between the
  // re-check and the insert, try the next free table before giving up.
  for (const table of candidates) {
    const result = await repository.insertReservation({
      restaurantId: booking.restaurantId,
      tableId: table.id,
      guestName: booking.name,
      guestPhone: booking.phone,
      guestEmail: booking.email,
      partySize: booking.partySize,
      startsAt,
      endsAt,
    });
    if (result.kind === "created") {
      return {
        ok: true,
        data: {
          reservationId: result.reservationId,
          manageToken: result.manageToken,
          restaurantName: details.restaurant.name,
          guestName: booking.name,
          guestEmail: booking.email,
          partySize: booking.partySize,
          startsAt,
        },
      };
    }
  }

  return {
    ok: false,
    code: "slot_taken",
    message: slotTakenMessage,
    alternatives: await findAlternatives(),
  };
}

function unavailable(message: string): BookingResult {
  return { ok: false, code: "unavailable", message, alternatives: [] };
}
