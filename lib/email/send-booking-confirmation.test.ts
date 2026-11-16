import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingConfirmationDetails } from "./booking-confirmation";

const send = vi.hoisted(() => vi.fn());
const ResendMock = vi.hoisted(() =>
  vi.fn(function (this: { emails: { send: unknown } }) {
    this.emails = { send };
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({ Resend: ResendMock }));

import { sendBookingConfirmationEmail } from "./send-booking-confirmation";

const details: BookingConfirmationDetails = {
  reservationId: "res-1",
  restaurantName: "Nonna Rosa's",
  guestName: "Maya Brooks",
  guestEmail: "maya@example.com",
  partySize: 2,
  startsAt: new Date("2026-11-08T02:00:00Z"),
  manageToken: "b".repeat(64),
};

describe("sendBookingConfirmationEmail", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("APP_BASE_URL", "https://tablenook.test");
    send.mockReset();
    ResendMock.mockClear();
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends from the Resend test sender to the guest with a manage link built from the token", async () => {
    await sendBookingConfirmationEmail(details);

    expect(ResendMock).toHaveBeenCalledWith("re_test_key");
    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][0];
    expect(message.from).toContain("onboarding@resend.dev");
    expect(message.to).toBe("maya@example.com");
    expect(message.html).toContain(`https://tablenook.test/bookings/${"b".repeat(64)}`);
    expect(message.text).toContain(`https://tablenook.test/bookings/${"b".repeat(64)}`);
  });

  it("skips sending when no API key is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendBookingConfirmationEmail(details);

    expect(send).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws an error without guest data when Resend returns an error", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Bad to: maya@example.com" },
    });

    const failure = await sendBookingConfirmationEmail(details).catch(
      (cause: Error) => cause,
    );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("validation_error");
    expect((failure as Error).message).not.toContain("maya@example.com");
  });

  it("throws an error without guest data when the request itself fails", async () => {
    send.mockRejectedValue(new Error("fetch failed for maya@example.com"));

    const failure = await sendBookingConfirmationEmail(details).catch(
      (cause: Error) => cause,
    );

    expect((failure as Error).message).toBe("Resend request failed");
  });

  it("refuses to build a link in production without APP_BASE_URL", async () => {
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    await expect(sendBookingConfirmationEmail(details)).rejects.toThrow(
      "APP_BASE_URL is not set",
    );
    expect(send).not.toHaveBeenCalled();
  });
});
