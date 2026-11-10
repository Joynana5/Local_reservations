import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getReservationByToken } from "@/lib/supabase/admin";
import { formatMapleBayDate, formatMapleBayTime } from "@/lib/search-time";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteHeader } from "@/components/ui/site-header";

export const metadata: Metadata = {
  title: "Booking confirmed - TableNook",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function BookingConfirmedPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[540px] px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <p role="status" className="text-muted">
              Loading your booking…
            </p>
          }
        >
          <ConfirmationContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}

async function ConfirmationContent({ params }: PageProps) {
  const { token } = await params;
  const reservation = await getReservationByToken(token);

  if (!reservation) {
    return (
      <EmptyState title="We couldn't find this booking">
        <p>The link may be incomplete or expired.</p>
        <Link href="/search" className={`${buttonClasses("secondary")} mt-4`}>
          Find a table
        </Link>
      </EmptyState>
    );
  }

  const cancelled = reservation.status === "cancelled";
  const startsAt = new Date(reservation.starts_at);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">
        {cancelled ? "Booking cancelled" : "You're booked"}
      </h1>
      <section
        aria-label="Reservation details"
        className="mt-6 rounded-xl border border-dashed border-muted bg-white p-6"
      >
        <p className="text-xl font-bold">{reservation.restaurant.name}</p>
        <p className="text-muted">
          {reservation.restaurant.cuisine} in{" "}
          {reservation.restaurant.neighborhood}
        </p>
        <p className="text-muted">{reservation.restaurant.address}</p>
        <p className="mt-4 font-bold">
          {formatMapleBayDate(startsAt)} at {formatMapleBayTime(startsAt)}
        </p>
        <p className="text-muted">
          {reservation.party_size === 1
            ? "1 person"
            : `${reservation.party_size} people`}{" "}
          · Booked for {reservation.guest_name}
        </p>
        <div className="mt-4">
          <Badge>{cancelled ? "Cancelled" : "Table confirmed"}</Badge>
        </div>
      </section>
      {!cancelled && (
        <p className="mt-4 text-muted">
          Confirmation emails to {reservation.guest_email} are coming soon. Save
          this page&apos;s link to find your booking again.
        </p>
      )}
      <p className="mt-2 text-sm text-muted">
        Times are in Maple Bay (Pacific Time).
      </p>
    </>
  );
}
