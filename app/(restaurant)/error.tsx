"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-[540px] px-4 py-10 sm:px-6">
      <div
        role="alert"
        className="rounded-xl border border-line bg-white p-8 text-center"
      >
        <p className="font-bold">Something went wrong</p>
        <p className="mt-2 text-muted">
          We couldn&apos;t load this page. Please try again.
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
