// @vitest-environment node
// Integration tests: the public API route handlers run against the real
// Supabase database (read-only, nothing is written). Locally the keys come
// from .env.local; in CI they come from GitHub Actions Secrets.
import { beforeAll, describe, expect, it, vi } from "vitest";

// lib/supabase/admin.ts imports "server-only", which throws outside Next.js
vi.mock("server-only", () => ({}));

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI): the variables are already in process.env
}

const hasDb = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// A date one week ahead, so every slot of that day is in the future
const date = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString().slice(0, 10);

type SearchGet = (request: Request) => Promise<Response>;
type AvailabilityGet = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response>;

let searchGet: SearchGet;
let availabilityGet: AvailabilityGet;

describe.skipIf(!hasDb)("public API (integration)", () => {
  // Imported after the env is loaded: the Supabase client reads it on import
  beforeAll(async () => {
    searchGet = (await import("./route")).GET;
    availabilityGet = (await import("./[id]/availability/route")).GET;
  });

  const search = (query: string) =>
    searchGet(new Request(`http://localhost/api/restaurants?${query}`));

  const availability = (id: string, query: string) =>
    availabilityGet(
      new Request(`http://localhost/api/restaurants/${id}/availability?${query}`),
      { params: Promise.resolve({ id }) },
    );

  describe("GET /api/restaurants", () => {
    it("returns seeded restaurants with a free table", async () => {
      const response = await search(`date=${date}&time=18:00&partySize=2`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.restaurants.length).toBeGreaterThan(0);
      for (const restaurant of body.restaurants) {
        expect(restaurant).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          neighborhood: expect.any(String),
          hasAvailability: true,
        });
      }
    });

    it("filters by neighborhood", async () => {
      const response = await search(
        `date=${date}&time=18:00&partySize=2&neighborhood=Riverside`,
      );
      const body = await response.json();
      for (const restaurant of body.restaurants) {
        expect(restaurant.neighborhood).toBe("Riverside");
      }
    });

    it("rejects an invalid query with 400 and field errors", async () => {
      const response = await search(`date=tomorrow&time=18:15&partySize=0`);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("invalid_query");
      expect(Object.keys(body.fieldErrors)).toEqual(
        expect.arrayContaining(["date", "time", "partySize"]),
      );
    });
  });

  describe("GET /api/restaurants/{id}/availability", () => {
    it("returns the day's slots for a seeded restaurant", async () => {
      const list = await (await search(`date=${date}&time=18:00&partySize=2`)).json();
      const id = list.restaurants[0].id;

      const response = await availability(id, `date=${date}&partySize=2`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({ restaurantId: id, date, partySize: 2, open: true });
      expect(body.slots.length).toBeGreaterThan(0);
      expect(body.slots[0]).toEqual({
        startsAt: expect.any(String),
        available: expect.any(Boolean),
      });
    });

    it("returns 404 for an unknown restaurant", async () => {
      const response = await availability(
        "00000000-0000-0000-0000-000000000000",
        `date=${date}&partySize=2`,
      );
      expect(response.status).toBe(404);
    });

    it("rejects a party size above 20 with 400", async () => {
      const response = await availability(
        "00000000-0000-0000-0000-000000000000",
        `date=${date}&partySize=25`,
      );
      expect(response.status).toBe(400);
    });
  });
}, 30_000);
