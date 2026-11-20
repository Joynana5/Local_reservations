import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";

function UseCaseCard({
  title,
  bullets,
  action,
}: {
  title: string;
  bullets: string[];
  action: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-line bg-white p-6">
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <div className="mt-auto pt-6">{action}</div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tighter sm:text-6xl lg:text-7xl">
            Your favorite local table, no phone call needed.
          </h1>
          <p className="mt-8 max-w-[34rem] text-lg leading-8 text-muted">
            TableNook helps small, independent restaurants in Maple Bay take
            online bookings for free. Guests see real availability and book in
            about a minute, without making an account.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="hidden -rotate-2 rounded-xl border border-dashed border-ink/60 bg-white p-6 shadow-sm lg:block"
        >
          <p className="text-xl font-bold">Nonna Rosa&apos;s</p>
          <p className="text-muted">Riverside</p>
          <dl className="mt-5 flex gap-8">
            <div>
              <dt className="text-sm text-muted">Tonight</dt>
              <dd className="text-xl font-bold">7:30 PM</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Party</dt>
              <dd className="text-xl font-bold">2 guests</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Badge>Table confirmed</Badge>
          </div>
        </div>
      </div>

      <h2 className="mt-16 text-2xl font-bold tracking-tight">
        How will you use TableNook?
      </h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <UseCaseCard
          title="I'm looking for a table"
          bullets={[
            "Search restaurants by neighborhood, time and party size",
            "Book with your name, phone and email",
            "Get a confirmation email with a link to manage your booking",
          ]}
          action={
            <Link href="/search" className={buttonClasses("primary")}>
              Find a table
            </Link>
          }
        />
        <UseCaseCard
          title="I run a restaurant"
          bullets={[
            "Free, with no per-guest fees",
            "Set up your profile, hours and tables in about 10 minutes",
            "See new bookings the moment guests make them",
          ]}
          action={
            <Link href="/login" className={buttonClasses("secondary")}>
              Set up or log in
            </Link>
          }
        />
      </div>
    </main>
  );
}
