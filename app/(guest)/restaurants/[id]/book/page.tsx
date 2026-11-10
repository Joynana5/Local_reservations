import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  isRestaurantId,
  parseBookingParams,
} from "@/lib/booking/search-params";
import { getRestaurantWithDetails } from "@/lib/supabase/admin";
import { BookingForm } from "@/components/guest/booking-form";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteHeader } from "@/components/ui/site-header";

export const metadata: Metadata = { title: "Book a table - TableNook" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; time?: string; party?: string }>;
}

export default function BookPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h1 className="mx-auto max-w-[540px] text-3xl font-bold tracking-tight">
          Book a table
        </h1>
        <div className="mt-6">
          <Suspense
            fallback={
              <p role="status" className="mx-auto max-w-[540px] text-muted">
                Loading…
              </p>
            }
          >
            <BookingContent {...props} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function BookingContent({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isRestaurantId(id)) notFound();

  const booking = parseBookingParams(query);
  const details = await getRestaurantWithDetails(id);
  if (!details) notFound();

  if (!booking) {
    return (
      <div className="mx-auto max-w-[540px]">
        <EmptyState title="Choose a time first">
          <Link
            href={`/restaurants/${id}`}
            className={buttonClasses("secondary")}
          >
            See available times
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <BookingForm
      restaurantId={id}
      restaurantName={details.restaurant.name}
      date={booking.date}
      time={booking.time}
      partySize={booking.partySize}
    />
  );
}
