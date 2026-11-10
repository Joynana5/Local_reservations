/**
 * Availability logic for restaurant reservations.
 * 
 * Rules (FR-6):
 * - 30-minute time slots
 * - Each reservation holds a table for 90 minutes
 * - A slot is available if at least one table with capacity ≥ party size has no overlapping reservations
 */

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
  // Reservation holds a table for 90 minutes
  const reservationDuration = 90 * 60 * 1000; // ms
  const slotEnd = new Date(slotStart.getTime() + reservationDuration);

  // Filter to tables that can accommodate the party
  const suitableTables = tables.filter((table) => table.capacity >= partySize);

  if (suitableTables.length === 0) {
    return false;
  }

  // Filter to active reservations (confirmed or seated)
  const activeReservations = reservations.filter(
    (res) => res.status === 'confirmed' || res.status === 'seated'
  );

  // Check if any suitable table has no overlapping reservation in the time slot
  return suitableTables.some((table) => {
    return !activeReservations.some((reservation) => {
      // If tableId is specified, only consider reservations on that table
      if (reservation.tableId && reservation.tableId !== table.id) {
        return false;
      }

      // Check for time overlap: [slotStart, slotEnd) with [reservation.startsAt, reservation.endsAt)
      return !(slotEnd <= reservation.startsAt || slotStart >= reservation.endsAt);
    });
  });
}

/**
 * Get all available 30-minute time slots within a restaurant's operating hours.
 * 
 * @param date - The date to check
 * @param openTime - Opening time as "HH:MM"
 * @param closeTime - Closing time as "HH:MM"
 * @param partySize - Number of people
 * @param tables - Available tables
 * @param reservations - Current reservations
 * @returns Array of available slot start times (ISO strings)
 */
export function getAvailableSlots(
  date: Date,
  openTime: string,
  closeTime: string,
  partySize: number,
  tables: Table[],
  reservations: Reservation[]
): string[] {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const slots: string[] = [];
  let currentTime = new Date(date);
  currentTime.setHours(openHour, openMinute, 0, 0);
  
  const closeTimeDate = new Date(date);
  closeTimeDate.setHours(closeHour, closeMinute, 0, 0);

  // We need 90 minutes to accommodate the reservation + 30-minute slot buffer
  const reservationDuration = 90 * 60 * 1000;
  const lastSlotStart = new Date(closeTimeDate.getTime() - reservationDuration);

  while (currentTime <= lastSlotStart) {
    if (isSlotAvailable(currentTime, partySize, tables, reservations)) {
      slots.push(currentTime.toISOString());
    }
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // 30-minute slots
  }

  return slots;
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
