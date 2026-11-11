import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => unknown>,
  insertReservation: vi.fn(),
  sendConfirmationEmail: vi.fn(),
}));

// Next's redirect() throws to stop the action; mimic that so the test can see where it goes.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => mocks.afterCallbacks.push(callback),
}));
vi.mock("../supabase/admin", () => ({
  getRestaurantWithDetails: async () => ({
    restaurant: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Nonna Rosa's",
    },
    openingHours: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      open_time: "17:00:00",
      close_time: "22:00:00",
      is_closed: false,
    })),
    tables: [{ id: "t1", capacity: 4 }],
  }),
  getReservationsForRestaurant: async () => [],
  insertReservation: mocks.insertReservation,
}));
vi.mock("../email/send-confirmation", () => ({
  sendConfirmationEmail: mocks.sendConfirmationEmail,
}));

const { createReservationAction } = await import("./create-reservation-action");

const token = "c".repeat(64);

function bookingForm() {
  const form = new FormData();
  const fields = {
    restaurantId: "00000000-0000-0000-0000-000000000001",
    date: "2099-11-07",
    time: "18:00",
    partySize: "2",
    name: "Maya Brooks",
    phone: "(555) 234-5678",
    email: "maya@example.com",
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  mocks.afterCallbacks.length = 0;
  mocks.insertReservation.mockReset();
  mocks.insertReservation.mockResolvedValue({
    kind: "created",
    reservationId: "res-1",
    manageToken: token,
  });
  mocks.sendConfirmationEmail.mockReset();
});

describe("createReservationAction confirmation email", () => {
  it("saves the booking, redirects to the confirmation page and queues the email with the booking details", async () => {
    mocks.sendConfirmationEmail.mockResolvedValue(true);

    await expect(createReservationAction(null, bookingForm())).rejects.toThrow(
      `REDIRECT:/bookings/${token}/confirmed`,
    );
    expect(mocks.insertReservation).toHaveBeenCalledOnce();
    expect(mocks.afterCallbacks).toHaveLength(1);

    await mocks.afterCallbacks[0]();
    expect(mocks.sendConfirmationEmail).toHaveBeenCalledWith({
      reservationId: "res-1",
      to: "maya@example.com",
      guestName: "Maya Brooks",
      restaurantName: "Nonna Rosa's",
      startsAt: new Date("2099-11-08T02:00:00Z"),
      partySize: 2,
      manageToken: token,
    });
  });

  it("still confirms the saved booking when sending the email fails", async () => {
    mocks.sendConfirmationEmail.mockResolvedValue(false);

    await expect(createReservationAction(null, bookingForm())).rejects.toThrow(
      `REDIRECT:/bookings/${token}/confirmed`,
    );
    await expect(mocks.afterCallbacks[0]()).resolves.toBe(false);
    expect(mocks.insertReservation).toHaveBeenCalledOnce();
  });

  it("does not queue an email when the booking is not saved", async () => {
    const form = bookingForm();
    form.set("email", "not-an-email");

    const result = await createReservationAction(null, form);

    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(mocks.insertReservation).not.toHaveBeenCalled();
    expect(mocks.afterCallbacks).toHaveLength(0);
  });
});
