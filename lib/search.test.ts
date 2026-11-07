import { describe, expect, it } from "vitest";
import { calculateAvailability, defaultFilters, localInstant, parseFilters, type Filters, type Reservation } from "./search";

const now = new Date("2026-07-01T12:00:00Z");
const defaults = defaultFilters(now);
const params = { neighborhood: "Riverside", date: "2026-07-02", time: "18:00", partySize: "4" };
const parsed = parseFilters(params, defaults, now);
if (!parsed.ok) throw new Error(parsed.error);
const filters: Filters = parsed.filters;
const restaurants = [
  { id: "a", name: "A", neighborhood: "Riverside", cuisine: "Italian", address: "1 Main", description: "" },
  { id: "b", name: "B", neighborhood: "Riverside", cuisine: "Mexican", address: "2 Main", description: "" },
];
const hours = [
  { restaurant_id: "a", open_time: "17:00:00", close_time: "22:00:00", is_closed: false },
  { restaurant_id: "b", open_time: "17:00:00", close_time: "22:00:00", is_closed: false },
];
const tables = [
  { id: "small", restaurant_id: "a", capacity: 2 },
  { id: "large", restaurant_id: "a", capacity: 4 },
  { id: "other", restaurant_id: "b", capacity: 6 },
];
const reservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  table_id: "large", starts_at: "2026-07-03T00:30:00Z", ends_at: "2026-07-03T02:00:00Z", status: "confirmed", ...overrides,
});
const availability = (bookings: Reservation[], selectedHours = hours, selectedTables = tables) =>
  calculateAvailability(restaurants, selectedHours, selectedTables, bookings, filters).map((r) => r.available);

describe("search filters", () => {
  it("uses the next half hour in Pacific time", () => {
    expect(defaultFilters(new Date("2026-07-01T23:40:00Z"))).toMatchObject({ date: "2026-07-01", time: "17:00", partySize: 2 });
    expect(defaultFilters(new Date("2026-11-01T07:45:00Z"))).toMatchObject({ date: "2026-11-01", time: "02:00" });
  });
  it("converts summer and winter local time correctly", () => {
    expect(localInstant("2026-07-02", "18:00")?.toISOString()).toBe("2026-07-03T01:00:00.000Z");
    expect(localInstant("2026-01-02", "18:00")?.toISOString()).toBe("2026-01-03T02:00:00.000Z");
  });
  it("rejects invalid dates, DST gaps and repeated times", () => {
    expect(localInstant("2026-02-30", "18:00")).toBeNull();
    expect(localInstant("2026-03-08", "02:30")).toBeNull();
    expect(localInstant("2026-11-01", "01:30")).toBeNull();
  });
  it.each([
    { ...params, date: "2026-02-30" },
    { ...params, time: "18:15" },
    { ...params, partySize: "0" },
    { ...params, partySize: "21" },
    { ...params, neighborhood: "Elsewhere" },
    { ...params, date: ["2026-07-02", "2026-07-03"] },
    { ...params, date: "2026-06-30" },
  ])("rejects invalid input %#", (input) => {
    expect(parseFilters(input, defaults, now).ok).toBe(false);
  });
});

describe("availability", () => {
  it("requires a suitable free table and only blocks overlapping active reservations", () => {
    expect(availability([])).toEqual([true, true]);
    expect(availability([reservation()])).toEqual([false, true]);
    expect(availability([reservation({ status: "seated" })])).toEqual([false, true]);
    expect(availability([reservation({ status: "cancelled" }), reservation({ status: "no_show" })])).toEqual([true, true]);
    expect(availability([reservation({ ends_at: "2026-07-03T01:00:00Z" })])).toEqual([true, true]);
    expect(availability([reservation({ starts_at: "2026-07-03T02:30:00Z", ends_at: "2026-07-03T03:30:00Z" })])).toEqual([true, true]);
  });
  it("handles opening boundaries, closed days, missing hours and table capacity", () => {
    expect(availability([], [{ ...hours[0], open_time: "18:00:00" }, { ...hours[1], close_time: "18:00:00" }])).toEqual([true, false]);
    expect(availability([], [{ ...hours[0], open_time: "18:00:30" }])).toEqual([false, false]);
    expect(availability([], [{ ...hours[0], is_closed: true }])).toEqual([false, false]);
    expect(availability([], hours, [tables[0]])).toEqual([false, false]);
  });
});
