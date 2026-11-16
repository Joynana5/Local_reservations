import { formatMapleBayDate, formatMapleBayTime } from "../search-time";

export interface BookingConfirmationDetails {
  reservationId: string;
  restaurantName: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  startsAt: Date;
  manageToken: string;
}

export interface BookingConfirmationEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildManageLink(baseUrl: string, manageToken: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/bookings/${manageToken}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildBookingConfirmationEmail(
  details: BookingConfirmationDetails,
  manageUrl: string,
): BookingConfirmationEmail {
  const date = formatMapleBayDate(details.startsAt);
  const time = formatMapleBayTime(details.startsAt);
  const party =
    details.partySize === 1 ? "1 person" : `${details.partySize} people`;

  const text = [
    `Hi ${details.guestName},`,
    "",
    `Your table at ${details.restaurantName} is confirmed.`,
    "",
    `Restaurant: ${details.restaurantName}`,
    `Date: ${date}`,
    `Time: ${time} (Maple Bay, Pacific Time)`,
    `Party size: ${party}`,
    "",
    `Manage your booking: ${manageUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: sans-serif; color: #1f1f1f;">
    <h1>You're booked</h1>
    <p>Hi ${escapeHtml(details.guestName)}, your table at <strong>${escapeHtml(details.restaurantName)}</strong> is confirmed.</p>
    <ul>
      <li>Restaurant: ${escapeHtml(details.restaurantName)}</li>
      <li>Date: ${escapeHtml(date)}</li>
      <li>Time: ${escapeHtml(time)} (Maple Bay, Pacific Time)</li>
      <li>Party size: ${escapeHtml(party)}</li>
    </ul>
    <p><a href="${escapeHtml(manageUrl)}">Manage your booking</a></p>
  </body>
</html>`;

  return {
    subject: `Your table at ${details.restaurantName} is confirmed`,
    html,
    text,
  };
}
