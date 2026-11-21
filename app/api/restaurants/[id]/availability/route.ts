// Public API: GET /api/restaurants/{id}/availability
// Returns every bookable 30-minute slot of a day for a party size, marked
// free or booked (FR-6). Slots that have already started are left out.
// Reuses the availability rules from lib/availability.ts.
import { z } from "zod";
import { getSlotAvailability, HOLD_MINUTES } from "../../../../../lib/availability";
import { getMapleBayInstant, getMapleBaySlot } from "../../../../../lib/search-time";
import {
  getReservationsForRestaurant,
  getRestaurantWithDetails,
} from "../../../../../lib/supabase/admin";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format."),
  partySize: z.coerce.number().int().min(1).max(20),
});

const notFound = () =>
  Response.json({ error: "not_found" }, { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) return notFound();

  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_query",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }
  const { date, partySize } = parsed.data;

  let weekday: number;
  try {
    weekday = getMapleBaySlot(date, "12:00").weekday;
  } catch {
    return Response.json(
      { error: "invalid_query", fieldErrors: { date: ["Choose a valid date."] } },
      { status: 400 },
    );
  }

  try {
    const details = await getRestaurantWithDetails(id);
    if (!details) return notFound();

    const hours = details.openingHours.find((item) => item.weekday === weekday);
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
      return Response.json({ restaurantId: id, date, partySize, open: false, slots: [] });
    }

    const openTime = hours.open_time.slice(0, 5);
    const closeTime = hours.close_time.slice(0, 5);
    const openAt = getMapleBayInstant(date, openTime).startsAt;
    const closeAt = getMapleBayInstant(date, closeTime).startsAt;

    const rows = await getReservationsForRestaurant(
      id,
      openAt,
      new Date(closeAt.getTime() + HOLD_MINUTES * 60_000),
    );
    const reservations = rows.map((row) => ({
      tableId: row.table_id,
      startsAt: new Date(row.starts_at),
      endsAt: new Date(row.ends_at),
      status: row.status,
    }));

    const now = Date.now();
    const slots = getSlotAvailability(
      date,
      openTime,
      closeTime,
      partySize,
      details.tables,
      reservations,
    ).filter((slot) => new Date(slot.startsAt).getTime() > now);

    return Response.json({ restaurantId: id, date, partySize, open: true, slots });
  } catch (cause) {
    console.error("GET /api/restaurants/[id]/availability failed:", cause);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
