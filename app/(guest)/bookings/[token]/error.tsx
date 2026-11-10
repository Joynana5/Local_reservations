"use client";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[540px] px-4 py-10 sm:px-6">
        <div
          role="alert"
          className="rounded-xl border border-line bg-white p-8 text-center"
        >
          <p className="font-bold">Something went wrong</p>
          <p className="mt-2 text-muted">
            We couldn&apos;t load your booking. Please try again.
          </p>
          <Button className="mt-4" onClick={reset}>
            Try again
          </Button>
        </div>
      </main>
    </div>
  );
}
