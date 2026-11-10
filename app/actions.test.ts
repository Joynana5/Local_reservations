import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  getRestaurants: vi.fn(),
  getRestaurantWithDetails: vi.fn(),
  getReservationsForRestaurant: vi.fn(),
}));

import { searchRestaurants } from "./actions";
import { getRestaurants, getRestaurantWithDetails, getReservationsForRestaurant } from "../lib/supabase";

const restaurant = {
  id: "r1", name: "Example", neighborhood: "Riverside", cuisine: "Italian",
  address: "Main Street", description: "", avg_turn_minutes: 45, created_at: "",
};
const hours = { id: "h", restaurant_id: "r1", weekday: 6, open_time: "17:00:00", close_time: "22:00:00", is_closed: false };
const table = { id: "t1", restaurant_id: "r1", label: "T1", capacity: 4 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getRestaurants).mockResolvedValue([restaurant]);
  vi.mocked(getRestaurantWithDetails).mockResolvedValue({ restaurant, openingHours: [hours], tables: [table] });
  vi.mocked(getReservationsForRestaurant).mockResolvedValue([]);
});

describe("restaurant search", () => {
  it("returns an open restaurant with a suitable free table", async () => {
    expect(await searchRestaurants("2026-11-07", "18:00", 4, "Riverside"))
      .toMatchObject([{ id: "r1", hasAvailability: true }]);
    expect(getRestaurants).toHaveBeenCalledWith("Riverside");
    expect(getReservationsForRestaurant).toHaveBeenCalledWith(
      "r1", new Date("2026-11-08T02:00:00Z"), new Date("2026-11-08T03:30:00Z"),
    );
  });

  it.each(["16:30", "22:00"])("excludes restaurants outside opening hours at %s", async (time) => {
    expect(await searchRestaurants("2026-11-07", time, 2)).toEqual([]);
    expect(getReservationsForRestaurant).not.toHaveBeenCalled();
  });

  it("excludes closed days", async () => {
    vi.mocked(getRestaurantWithDetails).mockResolvedValue({ restaurant, openingHours: [{ ...hours, is_closed: true }], tables: [table] });
    expect(await searchRestaurants("2026-11-07", "18:00", 2)).toEqual([]);
  });

  it("excludes tables too small or blocked by an overlapping reservation", async () => {
    expect(await searchRestaurants("2026-11-07", "18:00", 5)).toEqual([]);
    vi.mocked(getReservationsForRestaurant).mockResolvedValue([{
      id: "b1", table_id: "t1", starts_at: "2026-11-08T01:30:00Z",
      ends_at: "2026-11-08T02:30:00Z", status: "confirmed",
    }]);
    expect(await searchRestaurants("2026-11-07", "18:00", 4)).toEqual([]);
  });

  it("propagates database failures rather than returning an empty result", async () => {
    vi.mocked(getRestaurantWithDetails).mockRejectedValue(new Error("database failure"));
    await expect(searchRestaurants("2026-11-07", "18:00", 2)).rejects.toThrow("database failure");
  });

  it("rejects malformed or out-of-range search input", async () => {
    await expect(searchRestaurants("2026-11-07", "24:00", 2)).rejects.toThrow();
    await expect(searchRestaurants("2026-11-07", "18:00", 21)).rejects.toThrow();
    expect(getRestaurants).not.toHaveBeenCalled();
  });
});
