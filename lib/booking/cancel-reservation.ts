import { manageTokenSchema } from "../validation/cancel";

export type ReservationStatus = "confirmed" | "seated" | "no_show" | "cancelled";

export interface CancellableReservation {
  status: ReservationStatus;
  startsAt: Date;
}

// Only a confirmed reservation that has not started yet can be cancelled by the guest.
export function canCancel(
  reservation: CancellableReservation,
  now: Date,
): boolean {
  return reservation.status === "confirmed" && reservation.startsAt > now;
}

export interface CancelRepository {
  // Atomic: changes the row only if it is still confirmed and starts after `now`. Returns whether it did.
  cancelIfCancellable(token: string, now: Date): Promise<boolean>;
  getReservation(token: string): Promise<CancellableReservation | null>;
}

export type CancelResult =
  | { ok: true; data: { alreadyCancelled: boolean } }
  | { ok: false; code: "not_found" | "not_cancellable"; message: string };

const notFound: CancelResult = {
  ok: false,
  code: "not_found",
  message: "We couldn't find this booking.",
};

export async function cancelReservation(
  repository: CancelRepository,
  token: unknown,
  now: Date = new Date(),
): Promise<CancelResult> {
  const parsed = manageTokenSchema.safeParse(token);
  if (!parsed.success) return notFound;

  if (await repository.cancelIfCancellable(parsed.data, now)) {
    return { ok: true, data: { alreadyCancelled: false } };
  }

  // Nothing changed: find out why, so the guest gets the right message.
  const reservation = await repository.getReservation(parsed.data);
  if (!reservation) return notFound;
  if (reservation.status === "cancelled") {
    return { ok: true, data: { alreadyCancelled: true } };
  }
  return {
    ok: false,
    code: "not_cancellable",
    message:
      "This booking can no longer be cancelled online. Please contact the restaurant.",
  };
}
