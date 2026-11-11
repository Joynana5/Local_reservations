import { Resend } from "resend";
import { z } from "zod";
import { confirmationEmailSchema, emailEnvSchema } from "../validation/email";
import { buildConfirmationEmail } from "./confirmation-template";

export interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Resend's send() resolves with { error } on API errors and rejects on network errors.
export type SendEmail = (
  email: OutgoingEmail,
  options: { idempotencyKey: string },
) => Promise<{ error: { message: string } | null }>;

const resendSender =
  (apiKey: string): SendEmail =>
  (email, options) =>
    new Resend(apiKey).emails.send(email, options);

/**
 * Sends the booking confirmation (FR-8). Never throws: the booking is already saved,
 * so a failed email is only logged (server-side, without guest contact data).
 * Returns whether the email was accepted by Resend.
 */
export async function sendConfirmationEmail(
  input: unknown,
  env: Record<string, string | undefined> = process.env,
  send?: SendEmail,
): Promise<boolean> {
  const settings = emailEnvSchema.safeParse(env);
  if (!settings.success) {
    console.error(
      "Confirmation email not sent: invalid email settings:",
      Object.keys(z.flattenError(settings.error).fieldErrors).join(", "),
    );
    return false;
  }

  const email = confirmationEmailSchema.safeParse(input);
  if (!email.success) {
    console.error(
      "Confirmation email not sent: invalid email data:",
      Object.keys(z.flattenError(email.error).fieldErrors).join(", "),
    );
    return false;
  }

  const { reservationId } = email.data;
  const content = buildConfirmationEmail(
    email.data,
    settings.data.NEXT_PUBLIC_SITE_URL,
  );
  const sendEmail = send ?? resendSender(settings.data.RESEND_API_KEY);

  try {
    const { error } = await sendEmail(
      { from: settings.data.EMAIL_FROM, to: email.data.to, ...content },
      // Resend drops duplicates with the same key, so a retry never sends twice.
      { idempotencyKey: `booking-confirmation/${reservationId}` },
    );
    if (error) {
      console.error(
        `Confirmation email for reservation ${reservationId} failed:`,
        error.message,
      );
      return false;
    }
    return true;
  } catch (cause) {
    console.error(
      `Confirmation email for reservation ${reservationId} failed:`,
      cause instanceof Error ? cause.message : "unknown error",
    );
    return false;
  }
}
