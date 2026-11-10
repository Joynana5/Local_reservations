const zone = "America/Los_Angeles";

export function getMapleBaySlot(date: string, time: string): { startsAt: Date; weekday: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):(00|30)$/.test(time)) {
    throw new Error("Choose a valid date and a 30-minute time slot.");
  }
  return getMapleBayInstant(date, time);
}

// Any HH:MM local time (opening hours may not be on the half hour).
export function getMapleBayInstant(date: string, time: string): { startsAt: Date; weekday: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Choose a valid date and time.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localMillis = Date.UTC(year, month - 1, day, hour, minute);
  const calendar = new Date(localMillis);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
    throw new Error("Choose a valid date.");
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const matches: Date[] = [];
  // Los Angeles offsets are whole hours; matching local parts detects DST gaps and repeats.
  for (let offset = -8; offset <= -7; offset++) {
    const candidate = new Date(localMillis - offset * 60 * 60_000);
    const parts = formatter.formatToParts(candidate);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    if (Number(value("year")) === year && Number(value("month")) === month && Number(value("day")) === day
      && Number(value("hour")) === hour && Number(value("minute")) === minute) matches.push(candidate);
  }
  if (matches.length !== 1) {
    throw new Error("That local time is skipped or repeated during a daylight saving time change. Choose another time.");
  }
  return { startsAt: matches[0], weekday: calendar.getUTCDay() };
}

export function getMapleBayToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// "HH:MM" in Maple Bay local time, the format used in booking URLs.
export function formatMapleBayTime24(instant: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
}

// "7:00 PM" in Maple Bay local time, for display.
export function formatMapleBayTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(instant);
}

export function formatMapleBayDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric" }).format(instant);
}
