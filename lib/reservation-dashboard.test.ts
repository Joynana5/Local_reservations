import { describe, expect, it } from "vitest";
import {
  getReservationTableLabel,
  getTodayReservationSummary,
  sortReservationsByTime,
  type ReservationDashboardRow,
} from "./reservation-dashboard";

function reservation(
  id: string,
  startsAt: string,
  partySize = 2,
  status: ReservationDashboardRow["status"] = "confirmed",
): ReservationDashboardRow {
  return {
    id,
    restaurant_id: "restaurant-1",
    table_id: "table-1",
    guest_name: `Guest ${id}`,
    party_size: partySize,
    starts_at: startsAt,
    status,
    tables: { label: "Table 2" },
  };
}

describe("reservation dashboard", () => {
  it("sorts reservations by time and breaks ties by id", () => {
    const result = sortReservationsByTime([
      reservation("b", "2026-11-20T20:00:00.000Z"),
      reservation("a", "2026-11-20T19:00:00.000Z"),
    ]);

    expect(result.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("reads the embedded table label", () => {
    expect(getReservationTableLabel(reservation("a", "2026-11-20T19:00:00.000Z")))
      .toBe("Table 2");
  });

  it("counts active reservations and guests for the summary, excluding cancelled", () => {
    const result = getTodayReservationSummary([
      reservation("a", "2026-11-20T19:00:00.000Z", 4),
      reservation("b", "2026-11-20T20:00:00.000Z", 3, "cancelled"),
      reservation("c", "2026-11-20T21:00:00.000Z", 2, "seated"),
    ]);

    expect(result).toEqual({ count: 2, guests: 6 });
  });
});
