import { getMapleBayInstant } from "../search-time";

const MAX_DAYS_AHEAD = 60;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isRestaurantId = (value: string) => GUID.test(value);

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function isValidDate(value: string | undefined): value is string {
  if (!value) return false;
  try {
    getMapleBayInstant(value, "12:00");
    return true;
  } catch {
    return false;
  }
}

/** Date and party size from the G2 query string; anything invalid falls back to today / 2 people. */
export function parsePickerParams(
  params: { date?: string; party?: string },
  today: string,
): { date: string; partySize: number } {
  const latest = addDays(today, MAX_DAYS_AHEAD);
  const date =
    isValidDate(params.date) && params.date >= today && params.date <= latest
      ? params.date
      : today;
  const party = Number(params.party);
  const partySize =
    Number.isInteger(party) && party >= 1 && party <= 20 ? party : 2;
  return { date, partySize };
}

/** Date, time and party size passed from G2 to the booking form; null when any of them is missing or invalid. */
export function parseBookingParams(params: {
  date?: string;
  time?: string;
  party?: string;
}): { date: string; time: string; partySize: number } | null {
  const party = Number(params.party);
  if (
    !isValidDate(params.date) ||
    !params.time ||
    !/^([01]\d|2[0-3]):(00|30)$/.test(params.time)
  )
    return null;
  if (!Number.isInteger(party) || party < 1 || party > 20) return null;
  return { date: params.date, time: params.time, partySize: party };
}
