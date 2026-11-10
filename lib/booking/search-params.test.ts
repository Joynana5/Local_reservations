import { describe, expect, it } from "vitest";
import { parseBookingParams, parsePickerParams } from "./search-params";

describe("parsePickerParams", () => {
  const today = "2026-11-07";

  it("uses today and two people by default", () => {
    expect(parsePickerParams({}, today)).toEqual({ date: today, partySize: 2 });
  });

  it("keeps a valid date and party size", () => {
    expect(
      parsePickerParams({ date: "2026-11-20", party: "6" }, today),
    ).toEqual({ date: "2026-11-20", partySize: 6 });
  });

  it.each(["2026-11-06", "2027-02-01", "2026-02-30", "tomorrow", ""])(
    "falls back to today for date %j",
    (date) => {
      expect(parsePickerParams({ date }, today).date).toBe(today);
    },
  );

  it.each(["0", "21", "2.5", "x"])(
    "falls back to two people for party %j",
    (party) => {
      expect(parsePickerParams({ party }, today).partySize).toBe(2);
    },
  );
});

describe("parseBookingParams", () => {
  it("accepts date, 30-minute time and party size", () => {
    expect(
      parseBookingParams({ date: "2026-11-07", time: "18:30", party: "4" }),
    ).toEqual({ date: "2026-11-07", time: "18:30", partySize: 4 });
  });

  it.each([
    [{ time: "18:00", party: "2" }],
    [{ date: "2026-11-07", party: "2" }],
    [{ date: "2026-11-07", time: "18:00" }],
    [{ date: "2026-11-07", time: "18:15", party: "2" }],
    [{ date: "2026-11-07", time: "18:00", party: "0" }],
    [{ date: "2026-13-07", time: "18:00", party: "2" }],
  ])("returns null for incomplete or invalid params %j", (params) => {
    expect(parseBookingParams(params)).toBeNull();
  });
});
