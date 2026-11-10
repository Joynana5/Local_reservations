/**
 * Availability logic for restaurant reservations.
 * 
 * Rules (FR-6):
 * - 30-minute time slots
 * - Each reservation holds a table for 90 minutes
 * - A slot is available if at least one table with capacity ≥ party size has no overlapping reservations
 */

import { getMapleBayInstant } from './search-time';

export const SLOT_MINUTES = 30;
export const HOLD_MINUTES = 90;
const HOLD_MS = HOLD_MINUTES * 60 * 1000;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

export interface Reservation {
  startsAt: Date;
  endsAt: Date;
  status: 'confirmed' | 'seated' | 'no_show' | 'cancelled';
  tableId?: string;
}

export interface Table {
  id: string;
  capacity: number;
}

/**
 * Tables that can seat the party and have no overlapping active reservation,
 * smallest capacity first so large tables stay free for large parties.
 */
export function pickTables(
  slotStart: Date,
  partySize: number,
  tables: Table[],
  reservations: Reservation[]
): Table[] {
  const slotEnd = new Date(slotStart.getTime() + HOLD_MS);

  const activeReservations = reservations.filter(
    (res) => res.status === 'confirmed' || res.status === 'seated'
  );

  return tables
    .filter((table) => table.capacity >= partySize)
    .filter((table) => !activeReservations.some((reservation) => {
      // A reservation without a table blocks every table
      if (reservation.tableId && reservation.tableId !== table.id) {
        return false;
      }
      // Overlap of [slotStart, slotEnd) with [startsAt, endsAt)
      return !(slotEnd <= reservation.startsAt || slotStart >= reservation.endsAt);
    }))
    .sort((a, b) => a.capacity - b.capacity);
}

/**
 * Check if a time slot is available for a given party size at a restaurant.
 * 
 * @param slotStart - Start of the 30-minute slot (e.g., 18:00)
 * @param partySize - Number of people in the party
 * @param tables - Available tables at the restaurant
 * @param reservations - Current reservations (active: confirmed or seated)
 * @returns true if at least one suitable table with no overlapping reservation exists
 */
export function isSlotAvailable(
  slotStart: Date,
  partySize: number,
  tables: Table[],
  reservations: Reservation[]
): boolean {
  return pickTables(slotStart, partySize, tables, reservations).length > 0;
}

/**
 * A booking must end by closing time: the last slot is closing − 90 minutes.
 */
export function fitsBeforeClosing(slotStart: Date, closeAt: Date): boolean {
  return slotStart.getTime() + HOLD_MS <= closeAt.getTime();
}

/**
 * Get all available 30-minute time slots within a restaurant's operating hours.
 * 
 * @param date - Local Maple Bay date as "YYYY-MM-DD"
 * @param openTime - Opening time as "HH:MM"
 * @param closeTime - Closing time as "HH:MM"
 * @param partySize - Number of people
 * @param tables - Available tables
 * @param reservations - Current reservations
 * @returns Array of available slot start times (ISO strings)
 */
export function getAvailableSlots(
  date: string,
  openTime: string,
  closeTime: string,
  partySize: number,
  tables: Table[],
  reservations: Reservation[]
): string[] {
  const openAt = getMapleBayInstant(date, openTime.slice(0, 5)).startsAt;
  const closeAt = getMapleBayInstant(date, closeTime.slice(0, 5)).startsAt;

  const slots: string[] = [];
  for (
    let current = openAt;
    fitsBeforeClosing(current, closeAt);
    current = new Date(current.getTime() + SLOT_MS)
  ) {
    if (isSlotAvailable(current, partySize, tables, reservations)) {
      slots.push(current.toISOString());
    }
  }

  return slots;
}

/**
 * Every bookable slot of the day (start + 90 min within opening hours) for a party size, marked free or booked.
 * Empty when no table is large enough for the party.
 */
export function getSlotAvailability(
  date: string,
  openTime: string,
  closeTime: string,
  partySize: number,
  tables: Table[],
  reservations: Reservation[]
): Array<{ startsAt: string; available: boolean }> {
  const free = new Set(getAvailableSlots(date, openTime, closeTime, partySize, tables, reservations));
  return getAvailableSlots(date, openTime, closeTime, partySize, tables, []).map((startsAt) => ({
    startsAt,
    available: free.has(startsAt),
  }));
}

/**
 * Pick up to `limit` slots closest in time to the requested one (the requested slot itself is excluded),
 * returned in chronological order.
 */
export function getAlternativeSlots(
  requestedStart: Date,
  availableSlots: string[],
  limit = 3
): string[] {
  const requested = requestedStart.getTime();
  return availableSlots
    .filter((slot) => new Date(slot).getTime() !== requested)
    .sort((a, b) => {
      const distance = Math.abs(new Date(a).getTime() - requested) - Math.abs(new Date(b).getTime() - requested);
      return distance !== 0 ? distance : new Date(a).getTime() - new Date(b).getTime();
    })
    .slice(0, limit)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

/**
 * Check if a restaurant is open on a given weekday.
 * 
 * @param weekday - Day of week (0 = Sunday, 6 = Saturday, matching JS Date.getDay())
 * @param hours - Opening hours for all weekdays
 * @returns true if restaurant is open on that weekday
 */
export function isOpenOnWeekday(
  weekday: number,
  hours: Array<{ weekday: number; isClosed: boolean }>
): boolean {
  const dayHours = hours.find((h) => h.weekday === weekday);
  return dayHours ? !dayHours.isClosed : false;
}

/**
 * Get opening hours for a specific weekday.
 * 
 * @param weekday - Day of week (0-6)
 * @param hours - Opening hours for all weekdays
 * @returns { openTime, closeTime } or null if closed
 */
export function getWeekdayHours(
  weekday: number,
  hours: Array<{ weekday: number; openTime?: string; closeTime?: string; isClosed: boolean }>
): { openTime: string; closeTime: string } | null {
  const dayHours = hours.find((h) => h.weekday === weekday);
  if (!dayHours || dayHours.isClosed || !dayHours.openTime || !dayHours.closeTime) {
    return null;
  }
  return {
    openTime: dayHours.openTime,
    closeTime: dayHours.closeTime,
  };
}
