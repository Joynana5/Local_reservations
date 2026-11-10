"use client";

import { useActionState, useState } from "react";
import {
  createReservationAction,
  type BookingFormState,
} from "@/lib/actions/create-reservation-action";
import {
  formatMapleBayDate,
  formatMapleBayTime,
  formatMapleBayTime24,
  getMapleBayInstant,
} from "@/lib/search-time";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TimeSlotButton } from "@/components/ui/time-slot-button";

interface BookingFormProps {
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
}

export function BookingForm({
  restaurantId,
  restaurantName,
  date,
  time: initialTime,
  partySize,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState<
    BookingFormState,
    FormData
  >(createReservationAction, null);
  const [time, setTime] = useState(initialTime);
  const [alternativeChosen, setAlternativeChosen] = useState(false);
  // Controlled, because React resets uncontrolled fields after every form action
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const slot = getMapleBayInstant(date, time).startsAt;
  const fieldErrors = state?.code === "validation" ? state.fieldErrors : {};
  const hiddenFieldErrors = [
    fieldErrors.restaurantId,
    fieldErrors.date,
    fieldErrors.time,
    fieldErrors.partySize,
  ]
    .flat()
    .filter(Boolean);
  const unavailable =
    state &&
    (state.code === "slot_taken" || state.code === "unavailable") &&
    !alternativeChosen
      ? state
      : null;

  return (
    <div className="mx-auto max-w-[540px]">
      <section
        aria-label="Booking summary"
        className="rounded-xl border border-line bg-white p-5"
      >
        <p className="text-lg font-bold">{restaurantName}</p>
        <p className="text-muted">
          {formatMapleBayDate(slot)} at {formatMapleBayTime(slot)}
        </p>
        <p className="text-muted">
          {partySize === 1 ? "1 person" : `${partySize} people`}
        </p>
      </section>

      <div aria-live="polite" className="mt-4">
        {unavailable && (
          <div
            role="alert"
            className="rounded-xl border border-accent bg-accent/20 p-4"
          >
            <p className="font-bold">
              {unavailable.code === "slot_taken"
                ? "This time is no longer available"
                : unavailable.message}
            </p>
            {unavailable.alternatives.length > 0 ? (
              <>
                <p className="mt-1 text-sm">
                  Other times that day for your party:
                </p>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {unavailable.alternatives.map((alternative) => {
                    const start = new Date(alternative);
                    return (
                      <li key={alternative}>
                        <TimeSlotButton
                          label={formatMapleBayTime(start)}
                          onClick={() => {
                            setTime(formatMapleBayTime24(start));
                            setAlternativeChosen(true);
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-sm">
                Go back to choose another day or time.
              </p>
            )}
          </div>
        )}
        {state?.code === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-danger p-4 text-danger"
          >
            {state.message}
          </p>
        )}
        {hiddenFieldErrors.length > 0 && (
          <p
            role="alert"
            className="rounded-xl border border-danger p-4 text-danger"
          >
            {hiddenFieldErrors.join(" ")}
          </p>
        )}
      </div>

      <form
        action={formAction}
        onSubmit={() => setAlternativeChosen(false)}
        noValidate
        className="mt-6 flex flex-col gap-4 rounded-xl border border-line bg-white p-5"
      >
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />
        <input type="hidden" name="partySize" value={partySize} />
        <Field
          name="name"
          label="Name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name?.[0]}
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={fieldErrors.phone?.[0]}
          hint="10-digit US or Canadian number, e.g. (555) 234-5678."
        />
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email?.[0]}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Booking…" : "Book table"}
        </Button>
      </form>
    </div>
  );
}
