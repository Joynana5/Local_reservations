"use server";

import { z } from "zod";
import { isSlotAvailable } from "../lib/availability";
import { getRestaurantWithDetails, getRestaurants, getReservationsForRestaurant } from "../lib/supabase/admin";
import { getMapleBaySlot } from "../lib/search-time";

export interface RestaurantSearchResult {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  address: string;
  description: string;
  hasAvailability: boolean;
}

const searchSchema = z.object({
  date: z.string(),
  time: z.string(),
  partySize: z.number().int().min(1).max(20),
  neighborhood: z.enum(["Old Harbor", "Riverside", "Midtown", "Hillcrest"]).optional(),
});

export async function searchRestaurants(
  date: string,
  time: string,
  partySize: number,
  neighborhood?: string,
): Promise<RestaurantSearchResult[]> {
  const input = searchSchema.parse({ date, time, partySize, neighborhood });
  const { startsAt, weekday } = getMapleBaySlot(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
  const restaurants = await getRestaurants(input.neighborhood);

  const results = await Promise.all(restaurants.map(async (restaurant) => {
    const details = await getRestaurantWithDetails(restaurant.id);
    if (!details) throw new Error("Restaurant disappeared while searching");

    const hours = details.openingHours.find((item) => item.weekday === weekday);
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) return null;

    const startTimeStr = input.time;
    if (startTimeStr < hours.open_time.slice(0, 5) || startTimeStr >= hours.close_time.slice(0, 5)) {
      return null;
    }

    // FR-7: booking must end by closing time (last slot = closing - 90 min)
    const endTimeStr = new Date(startsAt.getTime() + 90 * 60_000).toLocaleTimeString('en-CA', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    if (endTimeStr > hours.close_time.slice(0, 5)) {
      return null;
    }

    const reservations = await getReservationsForRestaurant(restaurant.id, startsAt, endsAt);
    const available = isSlotAvailable(startsAt, input.partySize, details.tables, reservations.map((reservation) => ({
      tableId: reservation.table_id,
      startsAt: new Date(reservation.starts_at),
      endsAt: new Date(reservation.ends_at),
      status: reservation.status,
    })));

    if (!available) return null;
    return {
      id: restaurant.id,
      name: restaurant.name,
      neighborhood: restaurant.neighborhood,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      description: restaurant.description,
      hasAvailability: true,
    };
  }));
  return results.filter((result): result is NonNullable<typeof result> => result !== null);
}
