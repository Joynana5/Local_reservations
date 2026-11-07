import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultFilters, parseFilters } from "./search";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: mocks.from }) }));
import { searchRestaurants } from "./restaurant-search";

const now = new Date("2026-07-01T12:00:00Z");
const parsed = parseFilters({ neighborhood: "Riverside", date: "2026-07-02", time: "18:00", partySize: "4" }, defaultFilters(now), now);
if (!parsed.ok) throw new Error(parsed.error);

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.from.mockReset();
});

describe("restaurant search queries", () => {
  it("queries server-side data and applies availability", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    const data: Record<string, object[]> = {
      restaurants: [{ id: "a", name: "A", neighborhood: "Riverside", cuisine: "Italian", address: "1 Main", description: "" }],
      opening_hours: [{ restaurant_id: "a", open_time: "17:00:00", close_time: "22:00:00", is_closed: false }],
      tables: [{ id: "t", restaurant_id: "a", capacity: 4 }],
      reservations: [{ table_id: "t", starts_at: "2026-07-03T01:00:00Z", ends_at: "2026-07-03T02:00:00Z", status: "confirmed" }],
    };
    const selects: Record<string, string> = {};
    const filters: Array<[string, string, unknown]> = [];
    mocks.from.mockImplementation((table: string) => {
      let offset = 0;
      const builder = {
        select: (columns: string) => { selects[table] = columns; return builder; },
        order: () => builder,
        range: (from: number) => { offset = from; return builder; },
        eq: (column: string, value: unknown) => { filters.push([table, column, value]); return builder; },
        gte: () => builder,
        in: () => builder,
        lt: () => builder,
        gt: () => builder,
        then: (resolve: (result: object) => unknown) => Promise.resolve({ data: offset === 0 ? data[table] : [], error: null }).then(resolve),
      };
      return builder;
    });
    const result = await searchRestaurants(parsed.filters);
    expect(result).toHaveLength(1);
    expect(result[0].available).toBe(false);
    expect(selects.reservations).toBe("table_id,starts_at,ends_at,status");
    expect(filters).toContainEqual(["restaurants", "neighborhood", "Riverside"]);
    expect(filters).toContainEqual(["opening_hours", "weekday", 4]);
  });
  it("surfaces missing configuration and database errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    await expect(searchRestaurants(parsed.filters)).rejects.toThrow("must be configured");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
    mocks.from.mockImplementation(() => {
      const builder = {
        select: () => builder, order: () => builder, range: () => builder, eq: () => builder,
        gte: () => builder, in: () => builder, lt: () => builder, gt: () => builder,
        then: (resolve: (result: object) => unknown) => Promise.resolve({ data: null, error: { message: "database unavailable" } }).then(resolve),
      };
      return builder;
    });
    await expect(searchRestaurants(parsed.filters)).rejects.toThrow("database unavailable");
  });
});
