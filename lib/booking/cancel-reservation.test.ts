import { describe, expect, it } from "vitest";
import { pickTables, type Reservation } from "../availability";
import {
  canCancel,
  cancelReservation,
  type CancelRepository,
  type CancellableReservation,
} from "./cancel-reservation";

const token = "a".repeat(64);
const now = new Date("2026-11-10T12:00:00Z");
const future = new Date("2026-11-10T18:00:00Z");
const past = new Date("2026-11-10T11:00:00Z");

// In-memory repository whose cancel mirrors the conditional UPDATE in lib/supabase/admin.ts.
function fakeRepository(row: CancellableReservation | null) {
  const stored = row && { ...row };
  const repository: CancelRepository = {
    cancelIfCancellable: async (candidate, at) => {
      if (candidate !== token || !stored) return false;
      if (stored.status !== "confirmed" || stored.startsAt <= at) return false;
      stored.status = "cancelled";
      return true;
    },
    getReservation: async (candidate) =>
      candidate === token && stored ? { ...stored } : null,
  };
  return { repository, stored };
}

describe("canCancel", () => {
  it("allows a confirmed reservation that starts in the future", () => {
    expect(canCancel({ status: "confirmed", startsAt: future }, now)).toBe(true);
  });

  it("refuses a confirmed reservation that has already started", () => {
    expect(canCancel({ status: "confirmed", startsAt: past }, now)).toBe(false);
  });

  it("refuses a reservation starting exactly now", () => {
    expect(canCancel({ status: "confirmed", startsAt: now }, now)).toBe(false);
  });

  it.each(["seated", "no_show", "cancelled"] as const)(
    "refuses a %s reservation",
    (status) => {
      expect(canCancel({ status, startsAt: future }, now)).toBe(false);
    },
  );
});

describe("cancelReservation", () => {
  it("cancels a future confirmed reservation", async () => {
    const { repository, stored } = fakeRepository({
      status: "confirmed",
      startsAt: future,
    });

    const result = await cancelReservation(repository, token, now);

    expect(result).toEqual({ ok: true, data: { alreadyCancelled: false } });
    expect(stored?.status).toBe("cancelled");
  });

  it("frees the table for the same time slot again", async () => {
    const tables = [{ id: "t1", capacity: 4 }];
    const { repository, stored } = fakeRepository({
      status: "confirmed",
      startsAt: future,
    });
    const asReservation = (): Reservation => ({
      tableId: "t1",
      startsAt: future,
      endsAt: new Date(future.getTime() + 90 * 60_000),
      status: stored!.status,
    });
    expect(pickTables(future, 2, tables, [asReservation()])).toHaveLength(0);

    await cancelReservation(repository, token, now);

    expect(pickTables(future, 2, tables, [asReservation()])).toHaveLength(1);
  });

  it("treats cancelling an already cancelled reservation as success", async () => {
    const { repository } = fakeRepository({
      status: "cancelled",
      startsAt: future,
    });

    expect(await cancelReservation(repository, token, now)).toEqual({
      ok: true,
      data: { alreadyCancelled: true },
    });
  });

  it("refuses to cancel a reservation that has already started", async () => {
    const { repository, stored } = fakeRepository({
      status: "confirmed",
      startsAt: past,
    });

    const result = await cancelReservation(repository, token, now);

    expect(result).toMatchObject({ ok: false, code: "not_cancellable" });
    expect(stored?.status).toBe("confirmed");
  });

  it.each(["seated", "no_show"] as const)(
    "refuses to cancel a %s reservation",
    async (status) => {
      const { repository, stored } = fakeRepository({
        status,
        startsAt: future,
      });

      const result = await cancelReservation(repository, token, now);

      expect(result).toMatchObject({ ok: false, code: "not_cancellable" });
      expect(stored?.status).toBe(status);
    },
  );

  it("returns not_found for a well-formed token that matches nothing", async () => {
    const { repository } = fakeRepository(null);

    expect(await cancelReservation(repository, token, now)).toMatchObject({
      ok: false,
      code: "not_found",
    });
  });

  it.each([
    ["a malformed token", "not-a-token"],
    ["a missing token", undefined],
    ["a non-string token", 42],
  ])("returns not_found without touching the database for %s", async (_label, bad) => {
    let calls = 0;
    const repository: CancelRepository = {
      cancelIfCancellable: async () => {
        calls += 1;
        return false;
      },
      getReservation: async () => {
        calls += 1;
        return null;
      },
    };

    expect(await cancelReservation(repository, bad, now)).toMatchObject({
      ok: false,
      code: "not_found",
    });
    expect(calls).toBe(0);
  });

  it("does not cancel twice when two requests race for the same reservation", async () => {
    const { repository } = fakeRepository({
      status: "confirmed",
      startsAt: future,
    });

    const [first, second] = await Promise.all([
      cancelReservation(repository, token, now),
      cancelReservation(repository, token, now),
    ]);

    expect(first).toEqual({ ok: true, data: { alreadyCancelled: false } });
    expect(second).toEqual({ ok: true, data: { alreadyCancelled: true } });
  });
});
