// @vitest-environment node
// Integration tests: public API routes run against the real Supabase database.
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI): the variables are already in process.env.
}

const hasDb = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const allowWrites = process.env.INTEGRATION_ALLOW_WRITES === "1";

type ReservationsPost = (request: Request) => Promise<Response>;
type ReservationDelete = (
  request: Request,
  context: { params: Promise<{ token: string }> },
) => Promise<Response>;

let reservationsPost: ReservationsPost;
let reservationDelete: ReservationDelete;

function getOpenDateOneWeekAhead(): string {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60_000);
  for (let offset = 0; offset < 7; offset += 1) {
    if (date.getUTCDay() !== 1) return date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
  }
  throw new Error("Could not find an open seeded date.");
}

const date = getOpenDateOneWeekAhead();
const restaurantId = "00000000-0000-0000-0000-000000000001";

describe.skipIf(!hasDb)("public reservation API (integration)", () => {
  beforeAll(async () => {
    reservationsPost = (await import("./route")).POST;
    reservationDelete = (await import("./[token]/route")).DELETE;
  });

  it("rejects invalid JSON with 400", async () => {
    const response = await reservationsPost(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "validation" });
  });

  it("rejects invalid fields with 400 and field errors", async () => {
    const response = await reservationsPost(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantId: "not-a-uuid",
          date: "tomorrow",
          time: "18:15",
          partySize: 0,
          name: "",
          phone: "123",
          email: "not-an-email",
        }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("validation");
    expect(Object.keys(body.fieldErrors)).toEqual(
      expect.arrayContaining([
        "restaurantId",
        "date",
        "time",
        "partySize",
        "name",
        "phone",
        "email",
      ]),
    );
  });

  it("returns 422 for an unknown restaurant", async () => {
    const response = await reservationsPost(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantId: "00000000-0000-0000-0000-000000000000",
          date,
          time: "18:30",
          partySize: 2,
          name: "Test Guest",
          phone: "(555) 234-5678",
          email: "test@example.com",
        }),
      }),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: "unavailable" });
  });

  it("returns 404 when deleting with an invalid token", async () => {
    const response = await reservationDelete(
      new Request("http://localhost/api/reservations/not-a-token", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ token: "not-a-token" }) },
    );
    expect(response.status).toBe(404);
  });

  it.skipIf(!allowWrites)(
    "creates a booking a week ahead, then cancels it twice",
    async () => {
      const createResponse = await reservationsPost(
        new Request("http://localhost/api/reservations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            date,
            time: "18:30",
            partySize: 2,
            name: "Integration Test Guest",
            phone: "(555) 234-5678",
            email: "integration@example.com",
          }),
        }),
      );
      expect(createResponse.status).toBe(201);
      const created = await createResponse.json();
      expect(created).toEqual({
        reservationId: expect.any(String),
        manageToken: expect.any(String),
      });

      const cancelResponse = await reservationDelete(
        new Request(
          `http://localhost/api/reservations/${created.manageToken}`,
          {
            method: "DELETE",
          },
        ),
        { params: Promise.resolve({ token: created.manageToken }) },
      );
      expect(cancelResponse.status).toBe(200);
      expect(await cancelResponse.json()).toEqual({ alreadyCancelled: false });

      const repeatResponse = await reservationDelete(
        new Request(
          `http://localhost/api/reservations/${created.manageToken}`,
          {
            method: "DELETE",
          },
        ),
        { params: Promise.resolve({ token: created.manageToken }) },
      );
      expect(repeatResponse.status).toBe(200);
      expect(await repeatResponse.json()).toEqual({ alreadyCancelled: true });
    },
  );
});
