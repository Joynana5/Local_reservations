import { describe, expect, it } from "vitest";
import type { ConfirmationEmail } from "../validation/email";
import { buildConfirmationEmail, getManageUrl } from "./confirmation-template";

const token = "a".repeat(64);
const email: ConfirmationEmail = {
  reservationId: "res-1",
  to: "maya@example.com",
  guestName: "Maya Brooks",
  restaurantName: "Nonna Rosa's",
  startsAt: new Date("2026-11-08T02:00:00Z"), // Sat, Nov 7 at 6:00 PM in Maple Bay
  partySize: 2,
  manageToken: token,
};
const site = "https://tablenook.example";

describe("buildConfirmationEmail", () => {
  it("includes the restaurant, date, local time and party size in text and HTML", () => {
    const { subject, text, html } = buildConfirmationEmail(email, site);

    expect(subject).toBe("Your table at Nonna Rosa's is confirmed");
    for (const part of [text, html]) {
      expect(part).toContain("Sat, Nov 7");
      expect(part).toContain("6:00 PM");
      expect(part).toContain("2 people");
    }
    expect(text).toContain("Nonna Rosa's");
    expect(html).toContain("Nonna Rosa&#39;s");
  });

  it("links to the manage page with the full token", () => {
    const { text, html } = buildConfirmationEmail(email, site);
    const url = `${site}/bookings/${token}`;

    expect(text).toContain(url);
    expect(html).toContain(`href="${url}"`);
  });

  it("says 1 person for a party of one", () => {
    const { text } = buildConfirmationEmail({ ...email, partySize: 1 }, site);
    expect(text).toContain("Party: 1 person");
  });

  it("escapes HTML in guest-entered values", () => {
    const { html } = buildConfirmationEmail(
      { ...email, guestName: '<script>alert("x")</script>' },
      site,
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("getManageUrl", () => {
  it("builds an absolute manage URL without a double slash", () => {
    expect(getManageUrl(token, "http://localhost:3000/")).toBe(
      `http://localhost:3000/bookings/${token}`,
    );
  });
});
