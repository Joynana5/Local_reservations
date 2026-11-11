import { formatMapleBayDate, formatMapleBayTime } from "../search-time";
import type { ConfirmationEmail } from "../validation/email";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function getManageUrl(manageToken: string, siteUrl: string): string {
  return new URL(`/bookings/${encodeURIComponent(manageToken)}`, siteUrl).href;
}

// Booking confirmation (US-5, FR-8): restaurant, date, time, party size and the manage link.
export function buildConfirmationEmail(
  email: ConfirmationEmail,
  siteUrl: string,
): EmailContent {
  const date = formatMapleBayDate(email.startsAt);
  const time = formatMapleBayTime(email.startsAt);
  const party =
    email.partySize === 1 ? "1 person" : `${email.partySize} people`;
  const manageUrl = getManageUrl(email.manageToken, siteUrl);

  const text = [
    `Hi ${email.guestName},`,
    "",
    `Your table at ${email.restaurantName} is confirmed.`,
    "",
    `Date: ${date}`,
    `Time: ${time} (Maple Bay time)`,
    `Party: ${party}`,
    "",
    `Manage or cancel your booking: ${manageUrl}`,
    "",
    "Keep this link private: anyone with it can change your booking.",
    "",
    "TableNook",
  ].join("\n");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;font-weight:bold">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8f8f5;color:#1a1f1c;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e3e3de;border-radius:12px;padding:24px">
      <p style="margin:0 0 8px;font-weight:bold;color:#1f4a40">TableNook</p>
      <h1 style="margin:0 0 16px;font-size:24px">Your table is confirmed</h1>
      <p style="margin:0 0 16px">Hi ${escapeHtml(email.guestName)}, see you at <strong>${escapeHtml(email.restaurantName)}</strong>.</p>
      <table role="presentation" style="border-collapse:collapse;margin:0 0 24px">
        ${row("Date", date)}
        ${row("Time", `${time} (Maple Bay time)`)}
        ${row("Party", party)}
      </table>
      <a href="${escapeHtml(manageUrl)}" style="display:inline-block;background:#1f4a40;color:#ffffff;font-weight:bold;text-decoration:none;padding:12px 20px;border-radius:8px">Manage booking</a>
      <p style="margin:24px 0 0;font-size:14px;color:#5f6662">Keep this link private: anyone with it can change your booking.</p>
    </div>
  </body>
</html>`;

  return {
    subject: `Your table at ${email.restaurantName} is confirmed`,
    html,
    text,
  };
}
