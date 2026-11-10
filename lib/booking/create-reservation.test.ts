import { describe, expect, it, vi } from "vitest";
import type { Reservation } from "../availability";
import {
  createReservation,
  type BookingRepository,
  type BookingRestaurantDetails,
  type InsertReservationResult,
  type NewReservation,
} from "./create-reservation";

const restaurantId = "00000000-0000-0000-0000-000000000001";
const now = new Date("2026-11-01T00:00:00Z");
const hold = 90 * 60_000;

function details(tableIds: string[], capacity = 4): BookingRestaurantDetails {
  return {
    restaurant: { id: restaurantId, name: "Nonna Rosa's" },
    // 0 = Sunday ... 6 = Saturday; closed on Monday, open 17:00-22:00 otherwise
    openingHours: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      open_time: weekday === 1 ? null : "17:00:00",
      close_time: weekday === 1 ? null : "22:00:00",
      is_closed: weekday === 1,
    })),
    tables: tableIds.map((id) => ({ id, capacity })),
  };
}

interface StoredReservation extends Reservation {
  tableId: string;
}

// In-memory repository that refuses overlapping active rows on one table, like the no_double_booking constraint.
function createFakeRepository(tableIds: string[], capacity = 4) {
  const rows: StoredReservation[] = [];
  let counter = 0;
  const insertReservation = vi.fn(
    async (input: NewReservation): Promise<InsertReservationResult> => {
      await Promise.resolve(); // latency between the re-check and the insert, so concurrent bookings interleave
      const overlaps = rows.some(
        (row) =>
          row.tableId === input.tableId &&
          (row.status === "confirmed" || row.status === "seated") &&
          input.startsAt < row.endsAt &&
          row.startsAt < input.endsAt,
      );
      if (overlaps) return { kind: "overlap" };
      rows.push({
        tableId: input.tableId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: "confirmed",
      });
      counter += 1;
      return {
        kind: "created",
        reservationId: `res-${counter}`,
        manageToken: `token-${counter}`,
      };
    },
  );
  const repository: BookingRepository = {
    getRestaurantDetails: async (id) =>
      id === restaurantId ? details(tableIds, capacity) : null,
    getActiveReservations: async (_id, from, to) => {
      await Promise.resolve();
      return rows
        .filter(
          (row) =>
            (row.status === "confirmed" || row.status === "seated") &&
            row.startsAt < to &&
            row.endsAt > from,
        )
        .map((row) => ({ ...row }));
    },
    insertReservation,
  };
  return { repository, rows, insertReservation };
}

const form = {
  restaurantId,
  date: "2026-11-07", // Saturday
  time: "18:00",
  partySize: "2",
  name: "Maya Brooks",
  phone: "(555) 234-5678",
  email: "maya@example.com",
};
const slot1800 = new Date("2026-11-08T02:00:00Z");

function seed(
  rows: StoredReservation[],
  tableId: string,
  startsAt: Date,
  status: Reservation["status"] = "confirmed",
) {
  rows.push({
    tableId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + hold),
    status,
  });
}

describe("createReservation", () => {
  it("creates a confirmed 90-minute reservation and returns the manage token", async () => {
    const { repository, rows, insertReservation } = createFakeRepository([
      "t1",
    ]);

    const result = await createReservation(repository, form, now);

    expect(result).toEqual({
      ok: true,
      data: { reservationId: "res-1", manageToken: "token-1" },
    });
    expect(insertReservation).toHaveBeenCalledWith({
      restaurantId,
      tableId: "t1",
      guestName: "Maya Brooks",
      guestPhone: "+15552345678",
      guestEmail: "maya@example.com",
      partySize: 2,
      startsAt: slot1800,
      endsAt: new Date(slot1800.getTime() + hold),
    });
    expect(rows).toHaveLength(1);
  });

  it("books the smallest table that fits the party", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);
    vi.spyOn(repository, "getRestaurantDetails").mockResolvedValue({
      ...details([]),
      tables: [
        { id: "big", capacity: 8 },
        { id: "small", capacity: 2 },
        { id: "mid", capacity: 4 },
      ],
    });

    await createReservation(repository, form, now);

    expect(insertReservation.mock.calls[0][0].tableId).toBe("small");
  });

  it("rejects the booking with a slot-taken message and alternative times when the last table was booked meanwhile", async () => {
    const { repository, rows, insertReservation } = createFakeRepository([
      "t1",
    ]);
    seed(rows, "t1", slot1800); // another guest booked the only table while this guest filled the form

    const result = await createReservation(repository, form, now);

    expect(result).toEqual({
      ok: false,
      code: "slot_taken",
      message: "This time is no longer available.",
      alternatives: [
        "2026-11-08T03:30:00.000Z",
        "2026-11-08T04:00:00.000Z",
        "2026-11-08T04:30:00.000Z",
      ], // 19:30, 20:00, 20:30
    });
    expect(insertReservation).not.toHaveBeenCalled();
    expect(rows).toHaveLength(1);
  });

  it("never saves a double booking when two guests submit for the last table at the same time", async () => {
    const { repository, rows } = createFakeRepository(["t1"]);

    const results = await Promise.all([
      createReservation(
        repository,
        { ...form, name: "Guest A", email: "a@example.com" },
        now,
      ),
      createReservation(
        repository,
        { ...form, name: "Guest B", email: "b@example.com" },
        now,
      ),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const loser = results.find((result) => !result.ok);
    expect(loser).toMatchObject({ ok: false, code: "slot_taken" });
    expect(
      loser && !loser.ok && "alternatives" in loser ? loser.alternatives : [],
    ).not.toContain(slot1800.toISOString());
    expect(rows).toHaveLength(1);
  });

  it("gives simultaneous guests different tables when two tables are free", async () => {
    const { repository, rows } = createFakeRepository(["t1", "t2"]);

    const results = await Promise.all([
      createReservation(repository, form, now),
      createReservation(repository, form, now),
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(new Set(rows.map((row) => row.tableId))).toEqual(
      new Set(["t1", "t2"]),
    );
  });

  it("stores no more reservations than tables when many guests race for one slot", async () => {
    const { repository, rows } = createFakeRepository(["t1", "t2", "t3"]);

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        createReservation(repository, form, now),
      ),
    );

    expect(results.filter((result) => result.ok)).toHaveLength(3);
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.tableId)).size).toBe(3);
  });

  it("suggests at most three alternatives and none of them overlaps an existing booking", async () => {
    const { repository, rows } = createFakeRepository(["t1"]);
    seed(rows, "t1", slot1800);

    const result = await createReservation(repository, form, now);

    expect(result.ok).toBe(false);
    if (result.ok || result.code === "validation")
      throw new Error("unexpected result");
    expect(result.alternatives.length).toBeLessThanOrEqual(3);
    for (const alternative of result.alternatives) {
      const start = new Date(alternative);
      const clashes =
        start < new Date(slot1800.getTime() + hold) &&
        slot1800 < new Date(start.getTime() + hold);
      expect(clashes).toBe(false);
    }
  });

  it("treats a cancelled reservation as a free table", async () => {
    const { repository, rows } = createFakeRepository(["t1"]);
    seed(rows, "t1", slot1800, "cancelled");

    expect(await createReservation(repository, form, now)).toMatchObject({
      ok: true,
    });
  });

  it("allows a booking that starts exactly when the previous 90-minute hold ends", async () => {
    const { repository, rows } = createFakeRepository(["t1"]);
    seed(rows, "t1", new Date(slot1800.getTime() - hold));

    expect(await createReservation(repository, form, now)).toMatchObject({
      ok: true,
    });
  });

  it("returns field errors and creates nothing for an invalid phone number", async () => {
    const { repository, rows, insertReservation } = createFakeRepository([
      "t1",
    ]);

    const result = await createReservation(
      repository,
      { ...form, phone: "12345" },
      now,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "validation",
      fieldErrors: { phone: [expect.any(String)] },
    });
    expect(insertReservation).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0);
  });

  it("returns field errors and creates nothing for an invalid email", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    const result = await createReservation(
      repository,
      { ...form, email: "maya@" },
      now,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "validation",
      fieldErrors: { email: [expect.any(String)] },
    });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("refuses a slot that would run past closing time and suggests slots that fit", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    // closes 22:00 -> 21:00 would end at 22:30
    const result = await createReservation(
      repository,
      { ...form, time: "21:00" },
      now,
    );

    expect(result).toMatchObject({ ok: false, code: "unavailable" });
    if (result.ok || result.code === "validation")
      throw new Error("unexpected result");
    expect(result.alternatives).toEqual([
      "2026-11-08T03:30:00.000Z",
      "2026-11-08T04:00:00.000Z",
      "2026-11-08T04:30:00.000Z",
    ]);
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("accepts the last slot at closing time minus 90 minutes", async () => {
    const { repository } = createFakeRepository(["t1"]);

    expect(
      await createReservation(repository, { ...form, time: "20:30" }, now),
    ).toMatchObject({ ok: true });
  });

  it("refuses a slot before opening time", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    expect(
      await createReservation(repository, { ...form, time: "12:00" }, now),
    ).toMatchObject({ ok: false, code: "unavailable" });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("refuses a booking on a closed day", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    const result = await createReservation(
      repository,
      { ...form, date: "2026-11-09" },
      now,
    ); // Monday

    expect(result).toMatchObject({
      ok: false,
      code: "unavailable",
      message: "The restaurant is closed on this day.",
    });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("refuses a party bigger than every table", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"], 4);

    const result = await createReservation(
      repository,
      { ...form, partySize: "5" },
      now,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "unavailable",
      message: "No table is large enough for your party.",
    });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("refuses a time in the past", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    const result = await createReservation(
      repository,
      form,
      new Date("2026-11-08T02:00:00Z"),
    );

    expect(result).toMatchObject({ ok: false, code: "unavailable" });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("refuses an unknown restaurant", async () => {
    const { repository, insertReservation } = createFakeRepository(["t1"]);

    const result = await createReservation(
      repository,
      { ...form, restaurantId: "00000000-0000-0000-0000-0000000000ff" },
      now,
    );

    expect(result).toMatchObject({ ok: false, code: "unavailable" });
    expect(insertReservation).not.toHaveBeenCalled();
  });

  it("lets unexpected database errors propagate instead of reporting a taken slot", async () => {
    const { repository } = createFakeRepository(["t1"]);
    vi.spyOn(repository, "insertReservation").mockRejectedValue(
      new Error("connection lost"),
    );

    await expect(createReservation(repository, form, now)).rejects.toThrow(
      "connection lost",
    );
  });
});
