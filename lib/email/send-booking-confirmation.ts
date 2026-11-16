import "server-only";
import { Resend } from "resend";
import {
  buildBookingConfirmationEmail,
  buildManageLink,
  type BookingConfirmationDetails,
} from "./booking-confirmation";

// Until a domain is verified, Resend only allows its shared test sender.
const FROM_ADDRESS = "TableNook <onboarding@resend.dev>";

function getBaseUrl(): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_BASE_URL is not set");
  }
  return "http://localhost:3000";
}

// Errors never include the guest's data or the API key, so callers can log them as-is.
export async function sendBookingConfirmationEmail(
  details: BookingConfirmationDetails,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; skipping confirmation email.");
    return;
  }

  const email = buildBookingConfirmationEmail(
    details,
    buildManageLink(getBaseUrl(), details.manageToken),
  );
  let error: { name: string } | null;
  try {
    ({ error } = await new Resend(apiKey).emails.send({
      from: FROM_ADDRESS,
      to: details.guestEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }));
  } catch {
    throw new Error("Resend request failed");
  }
  if (error) {
    throw new Error(`Resend rejected the email (${error.name})`);
  }
}
