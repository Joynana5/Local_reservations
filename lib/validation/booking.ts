import { z } from "zod";

export const phoneErrorMessage =
  "Enter a valid 10-digit phone number, e.g. (555) 123-4567.";

// North American numbers only: 10 digits, optional +1 / 1 prefix, common separators allowed.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  else if (trimmed.startsWith("+")) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return `+1${digits}`;
}

export const bookingSchema = z.object({
  // z.guid(): the demo restaurant ids are not RFC-versioned UUIDs, which z.uuid() rejects
  restaurantId: z.guid("Choose a restaurant."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):(00|30)$/, "Choose a valid time slot."),
  partySize: z.coerce
    .number("Choose a party size.")
    .int("Choose a party size.")
    .min(1, "Choose a party size.")
    .max(20, "Parties of more than 20 can't book online."),
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  phone: z.string().transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: phoneErrorMessage });
      return z.NEVER;
    }
    return normalized;
  }),
  email: z
    .string()
    .trim()
    .max(254, "Email is too long.")
    .pipe(z.email("Enter a valid email address, e.g. name@example.com.")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingFieldErrors = Partial<Record<keyof BookingInput, string[]>>;
