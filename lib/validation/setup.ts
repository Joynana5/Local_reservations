import { z } from "zod";

export const NEIGHBORHOODS = [
  "Old Harbor",
  "Riverside",
  "Midtown",
  "Hillcrest",
] as const;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter a restaurant name."),
  neighborhood: z.enum(NEIGHBORHOODS, {
    error: "Choose a neighborhood.",
  }),
  cuisine: z.string().trim().min(1, "Enter a cuisine."),
  address: z.string().trim().min(1, "Enter an address."),
  description: z.string().trim().min(1, "Enter a short description."),
});

export const openingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  })
  .superRefine((hours, context) => {
    if (hours.isClosed) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.openTime)) {
      context.addIssue({
        code: "custom",
        path: ["openTime"],
        message: "Enter an opening time.",
      });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.closeTime)) {
      context.addIssue({
        code: "custom",
        path: ["closeTime"],
        message: "Enter a closing time.",
      });
    }
    if (
      hours.openTime &&
      hours.closeTime &&
      hours.closeTime <= hours.openTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["closeTime"],
        message: "Closing time must be after opening time.",
      });
    }
  });

export const setupSchema = z.object({
  profile: profileSchema,
  openingHours: z.array(openingHourSchema).length(7),
});

export const tableSchema = z.object({
  label: z.string().trim().min(1, "Enter a table label."),
  capacity: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(1, "Capacity must be between 1 and 20.")
    .max(20, "Capacity must be between 1 and 20."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type OpeningHoursInput = z.infer<typeof openingHourSchema>;
export type TableInput = z.infer<typeof tableSchema>;
