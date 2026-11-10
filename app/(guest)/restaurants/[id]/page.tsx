import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RefreshOnShow } from "@/components/guest/refresh-on-show";
import {
  getSlotAvailability,
  getWeekdayHours,
  HOLD_MINUTES,
} from "@/lib/availability";
import {
  addDays,
  isRestaurantId,
  parsePickerParams,
} from "@/lib/booking/search-params";
import {
  formatMapleBayTime,
  formatMapleBayTime24,
  getMapleBayInstant,
  getMapleBayToday,
} from "@/lib/search-time";
import {
  getReservationsForRestaurant,
  getRestaurantWithDetails,
} from "@/lib/supabase/admin";
import { SlotPickerForm } from "@/components/guest/slot-picker-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteHeader } from "@/components/ui/site-header";
import { TimeSlotButton } from "@/components/ui/time-slot-button";

export const metadata: Metadata = { title: "Pick a time - TableNook" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; party?: string }>;
}

export default function RestaurantPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <RefreshOnShow />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <p role="status" className="text-muted">
              Loading…
            </p>
          }
        >
          <RestaurantContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}

async function RestaurantContent({ params, searchParams }: PageProps) {
  // Request data first: everything below depends on it (and on the current time)
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isRestaurantId(id)) notFound();

  // The current date is request-time data
  await connection();
  const today = getMapleBayToday();
  const { date, partySize } = parsePickerParams(query, today);

  const details = await getRestaurantWithDetails(id);
  if (!details) notFound();
  const { restaurant, openingHours, tables } = details;

  const { weekday } = getMapleBayInstant(date, "12:00");
  const hours = getWeekdayHours(
    weekday,
    openingHours.map((item) => ({
      weekday: item.weekday,
      openTime: item.open_time?.slice(0, 5),
      closeTime: item.close_time?.slice(0, 5),
      isClosed: item.is_closed,
    })),
  );
  const largestTable = tables.reduce(
    (largest, table) => Math.max(largest, table.capacity),
    0,
  );

  let slots: Array<{ startsAt: string; available: boolean }> = [];
  let hoursLabel = "Closed on this day";
  if (hours) {
    const openAt = getMapleBayInstant(date, hours.openTime).startsAt;
    const closeAt = getMapleBayInstant(date, hours.closeTime).startsAt;
    hoursLabel = `${formatMapleBayTime(openAt)} – ${formatMapleBayTime(closeAt)}`;
    const reservations = await getReservationsForRestaurant(
      id,
      openAt,
      new Date(closeAt.getTime() + HOLD_MINUTES * 60_000),
    );
    const now = new Date();
    slots = getSlotAvailability(
      date,
      hours.openTime,
      hours.closeTime,
      partySize,
      tables,
      reservations.map((reservation) => ({
        tableId: reservation.table_id,
        startsAt: new Date(reservation.starts_at),
        endsAt: new Date(reservation.ends_at),
        status: reservation.status,
      })),
    ).filter((slot) => new Date(slot.startsAt) > now);
  }

  const bookHref = (startsAt: string) =>
    `/restaurants/${id}/book?${new URLSearchParams({
      date,
      time: formatMapleBayTime24(new Date(startsAt)),
      party: String(partySize),
    })}`;

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight">{restaurant.name}</h1>
      <p className="mt-1 text-muted">
        {restaurant.cuisine} in {restaurant.neighborhood}
      </p>
      {restaurant.description && (
        <p className="mt-3 max-w-2xl">{restaurant.description}</p>
      )}

      <dl className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm font-bold">Address</dt>
          <dd className="text-muted">{restaurant.address}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Hours on selected day</dt>
          <dd className="text-muted">{hoursLabel}</dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Largest table</dt>
          <dd className="text-muted">
            {largestTable ? `${largestTable} people` : "No tables yet"}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="pick-a-time" className="mt-10">
        <h2 id="pick-a-time" className="text-2xl font-bold tracking-tight">
          Pick a time
        </h2>
        <SlotPickerForm
          date={date}
          partySize={partySize}
          minDate={today}
          maxDate={addDays(today, 60)}
        />

        <div className="mt-6" aria-live="polite">
          {!hours ? (
            <EmptyState title="Closed on this day">
              Try another date.
            </EmptyState>
          ) : largestTable < partySize ? (
            <EmptyState title={`No table fits a party of ${partySize}`}>
              The largest table seats {largestTable}. Try a smaller party.
            </EmptyState>
          ) : slots.length === 0 ? (
            <EmptyState title="No times left on this day">
              Try another date.
            </EmptyState>
          ) : (
            <ul className="flex flex-wrap gap-3">
              {slots.map((slot) => (
                <li key={slot.startsAt}>
                  <TimeSlotButton
                    label={formatMapleBayTime(new Date(slot.startsAt))}
                    booked={!slot.available}
                    href={slot.available ? bookHref(slot.startsAt) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-4 text-sm text-muted">
          Times are in Maple Bay (Pacific Time). Slots start every 30 minutes
          and each booking holds a table for 90 minutes.
        </p>
      </section>
    </>
  );
}
