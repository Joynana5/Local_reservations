export type ReservationStatus =
  | "confirmed"
  | "seated"
  | "no_show"
  | "cancelled";

export interface ReservationDashboardRow {
  id: string;
  restaurant_id: string;
  table_id: string;
  guest_name: string;
  party_size: number;
  starts_at: string;
  status: ReservationStatus;
  tables: { label: string } | { label: string }[] | null;
}

export function getReservationTableLabel(
  reservation: ReservationDashboardRow,
): string {
  const table = reservation.tables;
  if (Array.isArray(table)) return table[0]?.label ?? "-";
  return table?.label ?? "-";
}

export function sortReservationsByTime(
  reservations: ReservationDashboardRow[],
): ReservationDashboardRow[] {
  return [...reservations].sort(
    (left, right) =>
      left.starts_at.localeCompare(right.starts_at) ||
      left.id.localeCompare(right.id),
  );
}

export function getTodayReservationSummary(
  reservations: ReservationDashboardRow[],
) {
  const active = reservations.filter(
    (reservation) => reservation.status !== "cancelled",
  );
  return {
    count: active.length,
    guests: active.reduce(
      (total, reservation) => total + reservation.party_size,
      0,
    ),
  };
}
