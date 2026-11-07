export const neighborhoods = ["Old Harbor", "Riverside", "Midtown", "Hillcrest"] as const;
export const TIME_ZONE = "America/Los_Angeles";
const HOLD_MS = 90 * 60 * 1000;

export type SearchParams = Record<string, string | string[] | undefined>;
export type Filters = {
  neighborhood: string;
  date: string;
  time: string;
  partySize: number;
  startsAt: Date;
};

const localFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function localParts(date: Date) {
  const parts = Object.fromEntries(localFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

// Find all instants matching a wall time, so DST gaps and repeated hours are not guessed.
export function localInstant(date: string, time: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(wall);
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 ||
      normalized.getUTCDate() !== day || hour > 23 || minute > 59) return null;

  const offsets = new Set<number>();
  for (const delta of [-36, -12, 0, 12, 36]) {
    const sample = wall + delta * 60 * 60 * 1000;
    const local = localParts(new Date(sample));
    const [y, m, d] = local.date.split("-").map(Number);
    const [h, min] = local.time.split(":").map(Number);
    offsets.add(Date.UTC(y, m - 1, d, h, min) - sample);
  }
  const matches = [...offsets]
    .map((offset) => new Date(wall - offset))
    .filter((candidate) => {
      const local = localParts(candidate);
      return local.date === date && local.time === time;
    });
  return matches.length === 1 ? matches[0] : null;
}

export function defaultFilters(now = new Date()): Filters {
  let timestamp = Math.ceil((now.getTime() + 1) / (30 * 60 * 1000)) * 30 * 60 * 1000;
  for (;;) {
    const startsAt = new Date(timestamp);
    const local = localParts(startsAt);
    if (localInstant(local.date, local.time)) return { neighborhood: "", ...local, partySize: 2, startsAt };
    timestamp += 30 * 60 * 1000;
  }
}

export function parseFilters(params: SearchParams, defaults: Filters, now = new Date()):
  | { ok: true; filters: Filters }
  | { ok: false; error: string } {
  const keys = ["neighborhood", "date", "time", "partySize"];
  if (keys.some((key) => Array.isArray(params[key]))) return { ok: false, error: "Each filter must have one value." };
  const neighborhood = (params.neighborhood as string | undefined) ?? defaults.neighborhood;
  const date = (params.date as string | undefined) ?? defaults.date;
  const time = (params.time as string | undefined) ?? defaults.time;
  const size = (params.partySize as string | undefined) ?? String(defaults.partySize);
  if (neighborhood && !neighborhoods.some((value) => value === neighborhood)) return { ok: false, error: "Choose a valid neighborhood." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:(00|30)$/.test(time)) return { ok: false, error: "Choose a valid date and a time on the half hour." };
  if (!/^(?:[1-9]|1\d|20)$/.test(size)) return { ok: false, error: "Choose a party size from 1 to 20." };
  const startsAt = localInstant(date, time);
  if (!startsAt) return { ok: false, error: "That local date and time is invalid or occurs twice due to a clock change." };
  if (startsAt.getTime() <= now.getTime()) return { ok: false, error: "Choose a future date and time." };
  return { ok: true, filters: { neighborhood, date, time, partySize: Number(size), startsAt } };
}

export type Restaurant = { id: string; name: string; neighborhood: string; cuisine: string; address: string; description: string };
export type OpeningHours = { restaurant_id: string; open_time: string | null; close_time: string | null; is_closed: boolean };
export type DiningTable = { id: string; restaurant_id: string; capacity: number };
export type Reservation = { table_id: string; starts_at: string; ends_at: string; status: string };

export function calculateAvailability(
  restaurants: Restaurant[], hours: OpeningHours[], tables: DiningTable[], reservations: Reservation[], filters: Filters,
) {
  const start = filters.startsAt.getTime();
  const end = start + HOLD_MS;
  const occupied = new Set(reservations.filter((reservation) =>
    (reservation.status === "confirmed" || reservation.status === "seated") &&
    Date.parse(reservation.starts_at) < end && Date.parse(reservation.ends_at) > start,
  ).map((reservation) => reservation.table_id));
  return restaurants.map((restaurant) => {
    const opening = hours.find((item) => item.restaurant_id === restaurant.id);
    const time = `${filters.time}:00`;
    const open = opening && !opening.is_closed && opening.open_time && opening.close_time &&
      time >= opening.open_time && time < opening.close_time;
    const available = Boolean(open && tables.some((table) =>
      table.restaurant_id === restaurant.id && table.capacity >= filters.partySize && !occupied.has(table.id),
    ));
    return { ...restaurant, available };
  });
}
