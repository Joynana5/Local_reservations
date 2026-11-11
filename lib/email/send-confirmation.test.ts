import { afterEach, describe, expect, it, vi } from "vitest";
import { sendConfirmationEmail, type SendEmail } from "./send-confirmation";

const token = "f".repeat(64);
const input = {
  reservationId: "res-1",
  to: "maya@example.com",
  guestName: "Maya Brooks",
  restaurantName: "Nonna Rosa's",
  startsAt: new Date("2026-11-08T02:00:00Z"),
  partySize: 2,
  manageToken: token,
};
const env = {
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "",
  NEXT_PUBLIC_SITE_URL: "",
};

afterEach(() => vi.restoreAllMocks());

function silenceErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("sendConfirmationEmail", () => {
  it("sends to the guest from the default sender with a manage link and an idempotency key", async () => {
    const send = vi.fn<SendEmail>(async () => ({ error: null }));

    await expect(sendConfirmationEmail(input, env, send)).resolves.toBe(true);

    expect(send).toHaveBeenCalledOnce();
    const [message, options] = send.mock.calls[0];
    expect(message.from).toBe("TableNook <onboarding@resend.dev>");
    expect(message.to).toBe("maya@example.com");
    expect(message.subject).toContain("Nonna Rosa's");
    expect(message.text).toContain(`http://localhost:3000/bookings/${token}`);
    expect(options).toEqual({
      idempotencyKey: "booking-confirmation/res-1",
    });
  });

  it("does not throw and logs when Resend rejects (network error)", async () => {
    const log = silenceErrors();
    const send = vi.fn<SendEmail>(async () => {
      throw new Error("fetch failed");
    });

    await expect(sendConfirmationEmail(input, env, send)).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith(
      "Confirmation email for reservation res-1 failed:",
      "fetch failed",
    );
  });

  it("does not throw and logs when Resend returns an API error", async () => {
    const log = silenceErrors();
    const send = vi.fn<SendEmail>(async () => ({
      error: { message: "Invalid API key" },
    }));

    await expect(sendConfirmationEmail(input, env, send)).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith(
      "Confirmation email for reservation res-1 failed:",
      "Invalid API key",
    );
  });

  it("never writes the guest's email address to the log", async () => {
    const log = silenceErrors();
    const send = vi.fn<SendEmail>(async () => {
      throw new Error("boom");
    });

    await sendConfirmationEmail(input, env, send);

    expect(JSON.stringify(log.mock.calls)).not.toContain("maya@example.com");
  });

  it("skips sending and logs the setting name when RESEND_API_KEY is missing", async () => {
    const log = silenceErrors();
    const send = vi.fn<SendEmail>();

    await expect(
      sendConfirmationEmail(input, { ...env, RESEND_API_KEY: undefined }, send),
    ).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(log.mock.calls[0].join(" ")).toContain("RESEND_API_KEY");
  });

  it("skips sending when the email data is invalid", async () => {
    silenceErrors();
    const send = vi.fn<SendEmail>();

    await expect(
      sendConfirmationEmail({ ...input, to: "not-an-email" }, env, send),
    ).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
