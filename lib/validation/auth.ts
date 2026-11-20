import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt (used by Supabase Auth) ignores everything after 72 bytes
const MAX_PASSWORD_LENGTH = 72;

const emailSchema = z
  .string()
  .trim()
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address, e.g. name@example.com."));

export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    ),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthFieldErrors = Partial<Record<keyof SignupInput, string[]>>;
