import { describe, expect, it } from "vitest";
import {
  buildBookingConfirmationEmail,
  buildManageLink,
  type BookingConfirmationDetails,
} from "./booking-confirmation";

const details: BookingConfirmationDetails = {
  reservationId: "res-1",
  restaurantName: "Nonna Rosa's",
  guestName: "Maya Brooks",
  guestEmail: "maya@example.com",
  partySize: 4,
  startsAt: new Date("2026-11-08T02:00:00Z"), // Sat Nov 7, 6:00 PM Maple Bay
  manageToken: "a".repeat(64),
};

describe("buildManageLink", () => {
  it("points at the manage booking route with the token", () => {
    expect(buildManageLink("https://tablenook.test", "abc")).toBe(
      "https://tablenook.test/bookings/abc",
    );
  });

  it("does not double the slash when the base URL ends with one", () => {
    expect(buildManageLink("https://tablenook.test/", "abc")).toBe(
      "https://tablenook.test/bookings/abc",
    );
  });
});

describe("buildBookingConfirmationEmail", () => {
  const link = buildManageLink("https://tablenook.test", details.manageToken);

  it("includes restaurant, date, local time, party size and the manage link in both formats", () => {
    const email = buildBookingConfirmationEmail(details, link);

    for (const body of [email.text, email.html]) {
      expect(body).toContain("Sat, Nov 7");
      expect(body).toContain("6:00 PM");
      expect(body).toContain("4 people");
      expect(body).toContain(link);
    }
    expect(email.subject).toContain("Nonna Rosa's");
    expect(email.text).toContain("Nonna Rosa's");
  });

  it("uses singular wording for a party of one", () => {
    const email = buildBookingConfirmationEmail(
      { ...details, partySize: 1 },
      link,
    );

    expect(email.text).toContain("1 person");
  });

  it("escapes HTML in guest and restaurant names", () => {
    const email = buildBookingConfirmationEmail(
      {
        ...details,
        guestName: "<script>alert(1)</script>",
        restaurantName: "Tom & Jerry's <b>",
      },
      link,
    );

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Tom &amp; Jerry&#39;s &lt;b&gt;");
  });
});
