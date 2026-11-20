"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase/client";
import { changeReservationStatusAction } from "@/lib/actions/reservation-actions";
import {
  getReservationTableLabel,
  getTodayReservationSummary,
  sortReservationsByTime,
  type ReservationDashboardRow,
  type ReservationStatus,
} from "@/lib/reservation-dashboard";
import { formatMapleBayTime } from "@/lib/search-time";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

interface ReservationDashboardProps {
  restaurantId: string;
  restaurantName: string;
  dateLabel: string;
  todayStart: string;
  tomorrowStart: string;
  initialReservations: ReservationDashboardRow[];
}

const statusLabels: Record<ReservationStatus, string> = {
  confirmed: "Confirmed",
  seated: "Seated",
  no_show: "No-show",
  cancelled: "Cancelled",
};

function statusClasses(status: ReservationStatus, cancelled: boolean) {
  if (cancelled) return "border-dashed border-line bg-white text-muted line-through";
  if (status === "seated") return "border-accent bg-accent text-ink";
  if (status === "no_show") return "border-dashed border-muted bg-white text-muted";
  return "border-brand bg-white text-brand";
}

export function ReservationDashboard({
  restaurantId,
  restaurantName,
  dateLabel,
  todayStart,
  tomorrowStart,
  initialReservations,
}: ReservationDashboardProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [view, setView] = useState<"today" | "upcoming">("today");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();

  const refreshReservations = useCallback(async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, restaurant_id, table_id, guest_name, party_size, starts_at, status, tables(label)",
      )
      .eq("restaurant_id", restaurantId)
      .gte("starts_at", todayStart)
      .order("starts_at", { ascending: true });
    if (error) {
      setMessage("Live reservations could not refresh.");
      return;
    }
    setReservations((data ?? []) as ReservationDashboardRow[]);
  }, [restaurantId, todayStart]);

  useEffect(() => {
    const channel = supabase
      .channel(`restaurant-reservations-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          void refreshReservations();
        },
      )
      .subscribe();

    const pollId = window.setInterval(() => {
      void refreshReservations();
    }, 5_000);

    return () => {
      window.clearInterval(pollId);
      void supabase.removeChannel(channel);
    };
  }, [refreshReservations, restaurantId]);

  const todayReservations = useMemo(
    () =>
      sortReservationsByTime(
        reservations.filter(
          (row) =>
            row.starts_at >= todayStart && row.starts_at < tomorrowStart,
        ),
      ),
    [reservations, todayStart, tomorrowStart],
  );
  const upcomingReservations = useMemo(
    () =>
      sortReservationsByTime(
        reservations.filter((row) => row.starts_at >= tomorrowStart),
      ),
    [reservations, tomorrowStart],
  );
  const summary = getTodayReservationSummary(todayReservations);
  const visible =
    view === "today" ? todayReservations : upcomingReservations;

  function changeStatus(reservationId: string, status: ReservationStatus) {
    setPendingId(reservationId);
    setReservations((current) =>
      current.map((row) =>
        row.id === reservationId ? { ...row, status } : row,
      ),
    );
    startTransition(async () => {
      const result = await changeReservationStatusAction(reservationId, status);
      if (!result.ok) {
        setMessage(result.message);
        await refreshReservations();
      } else {
        setMessage("Reservation status updated.");
      }
      setPendingId(null);
    });
  }

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{restaurantName}</h1>
          <p className="mt-2 text-muted">{dateLabel}</p>
        </div>
        <p className="text-right text-muted">
          <strong className="text-ink">{summary.count} reservations</strong>
          {", "}
          {summary.guests} guests expected
        </p>
      </div>

      <div className="mt-8">
        <Tabs
          tabs={[
            { id: "reservations", label: "Reservations" },
            { id: "waitlist", label: "Waitlist", disabled: true },
          ]}
          activeId="reservations"
          label="Dashboard sections"
        />
      </div>

      <div className="mt-6 flex gap-2" aria-label="Reservation range">
        {([
          ["today", "Today", todayReservations.length],
          ["upcoming", "Upcoming", upcomingReservations.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={[
              "rounded-full px-4 py-2 text-sm font-bold",
              view === id
                ? "bg-brand/10 text-brand"
                : "border border-line bg-white text-muted",
            ].join(" ")}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">
        {message}
      </p>

      {visible.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No reservations today" />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Guest</th>
                <th className="px-5 py-4">Party</th>
                <th className="px-5 py-4">Table</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((reservation) => {
                const cancelled = reservation.status === "cancelled";
                return (
                  <tr
                    key={reservation.id}
                    className={[
                      "border-b border-line last:border-b-0",
                      cancelled ? "bg-paper text-muted" : "",
                    ].join(" ")}
                  >
                    <td className="px-5 py-4 font-bold">
                      {formatMapleBayTime(new Date(reservation.starts_at))}
                    </td>
                    <td className={`px-5 py-4 ${cancelled ? "line-through" : ""}`}>
                      {reservation.guest_name}
                    </td>
                    <td className="px-5 py-4">{reservation.party_size}</td>
                    <td className="px-5 py-4">
                      {getReservationTableLabel(reservation)}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        aria-label={`Status for ${reservation.guest_name}`}
                        value={reservation.status}
                        disabled={pendingId === reservation.id}
                        onChange={(event) =>
                          changeStatus(
                            reservation.id,
                            event.target.value as ReservationStatus,
                          )
                        }
                        className={[
                          "rounded-full border px-3 py-1.5 text-sm font-bold",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                          statusClasses(reservation.status, cancelled),
                        ].join(" ")}
                      >
                        {(
                          [
                            "confirmed",
                            "seated",
                            "no_show",
                            "cancelled",
                          ] as const
                        ).map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
