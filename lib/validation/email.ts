import { z } from "zod";

// `NAME=` in .env.local gives "", which should count as "not set" so the default applies.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

// Server-only email settings (FR-8). The API key lives in .env.local, never in code.
export const emailEnvSchema = z.object({
  RESEND_API_KEY: z
    .string("RESEND_API_KEY is not set.")
    .startsWith("re_", "RESEND_API_KEY must start with re_."),
  // Without a verified domain, Resend only sends from onboarding@resend.dev (to the account owner).
  EMAIL_FROM: optional(
    z.string().trim().min(1).default("TableNook <onboarding@resend.dev>"),
  ),
  NEXT_PUBLIC_SITE_URL: optional(
    z
      .url("NEXT_PUBLIC_SITE_URL must be a full URL.")
      .default("http://localhost:3000"),
  ),
});

export type EmailEnv = z.infer<typeof emailEnvSchema>;

export const confirmationEmailSchema = z.object({
  reservationId: z.string().min(1),
  to: z.email(),
  guestName: z.string().trim().min(1).max(100),
  restaurantName: z.string().trim().min(1),
  startsAt: z.date(),
  partySize: z.int().min(1).max(20),
  // Long, random, unguessable: the DB generates 64 hex characters (32 random bytes).
  manageToken: z.string().regex(/^[A-Za-z0-9_-]{32,}$/),
});

export type ConfirmationEmail = z.infer<typeof confirmationEmailSchema>;
