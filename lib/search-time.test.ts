import { describe, expect, it } from "vitest";
import { getMapleBaySlot } from "./search-time";

describe("Maple Bay search time", () => {
  it("uses the local date and Pacific standard time", () => {
    const slot = getMapleBaySlot("2026-11-07", "18:00");
    expect(slot.weekday).toBe(6);
    expect(slot.startsAt.toISOString()).toBe("2026-11-08T02:00:00.000Z");
  });

  it("uses daylight time in summer", () => {
    expect(getMapleBaySlot("2026-07-07", "18:30").startsAt.toISOString())
      .toBe("2026-07-08T01:30:00.000Z");
  });

  it.each([
    ["2026-02-30", "18:00"],
    ["2026-11-07", "25:00"],
    ["2026-11-07", "18:15"],
    ["2026-03-08", "02:30"],
    ["2026-11-01", "01:30"],
  ])("rejects invalid or ambiguous local time %s %s", (date, time) => {
    expect(() => getMapleBaySlot(date, time)).toThrow();
  });
});
