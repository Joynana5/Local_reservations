"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fieldControlClass } from "@/components/ui/field";

interface SlotPickerFormProps {
  date: string;
  partySize: number;
  minDate: string;
  maxDate: string;
}

// Changing the date or party size reloads the slots right away; the submit button is only a no-JavaScript fallback.
export function SlotPickerForm({
  date,
  partySize,
  minDate,
  maxDate,
}: SlotPickerFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [dateValue, setDateValue] = useState(date);
  const [partyValue, setPartyValue] = useState(partySize);
  const [shown, setShown] = useState({ date, partySize });

  // Follow the URL when it changes (e.g. browser Back)
  if (shown.date !== date || shown.partySize !== partySize) {
    setShown({ date, partySize });
    setDateValue(date);
    setPartyValue(partySize);
  }

  function apply(nextDate: string, nextParty: number) {
    if (!nextDate) return;
    const query = new URLSearchParams({
      date: nextDate,
      party: String(nextParty),
    });
    startTransition(() => router.replace(`${pathname}?${query}`));
  }

  return (
    <form method="get" className="mt-4 flex flex-wrap items-end gap-4">
      <div>
        <label htmlFor="date" className="block text-sm font-bold">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          value={dateValue}
          min={minDate}
          max={maxDate}
          onChange={(event) => {
            setDateValue(event.target.value);
            apply(event.target.value, partyValue);
          }}
          className={`${fieldControlClass} mt-1`}
        />
      </div>
      <div>
        <label htmlFor="party" className="block text-sm font-bold">
          Party size
        </label>
        <select
          id="party"
          name="party"
          value={partyValue}
          onChange={(event) => {
            const next = Number(event.target.value);
            setPartyValue(next);
            apply(dateValue, next);
          }}
          className={`${fieldControlClass} mt-1`}
        >
          {Array.from({ length: 20 }, (_, index) => index + 1).map((size) => (
            <option key={size} value={size}>
              {size === 1 ? "1 person" : `${size} people`}
            </option>
          ))}
        </select>
      </div>
      <noscript>
        <button type="submit">Show times</button>
      </noscript>
      {pending && (
        <p role="status" className="pb-2 text-sm text-muted">
          Updating times…
        </p>
      )}
    </form>
  );
}
