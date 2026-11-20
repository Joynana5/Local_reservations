"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/ui/field";
import {
  addTableAction,
  deleteTableAction,
  editTableAction,
  saveSetupAction,
  type SetupActionState,
  type TableActionState,
} from "@/lib/actions/setup-actions";
import { NEIGHBORHOODS } from "@/lib/validation/setup";

interface SetupRestaurant {
  name: string;
  neighborhood: string;
  cuisine: string;
  address: string;
  description: string;
}

interface OpeningHour {
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

interface TableRow {
  id: string;
  label: string;
  capacity: number;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function SetupForm({
  restaurant,
  openingHours,
  tables,
}: {
  restaurant: SetupRestaurant | null;
  openingHours: OpeningHour[];
  tables: TableRow[];
}) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState<
    SetupActionState,
    FormData
  >(saveSetupAction, null);
  const [name, setName] = useState(restaurant?.name ?? "");
  const [neighborhood, setNeighborhood] = useState(
    restaurant?.neighborhood ?? NEIGHBORHOODS[0],
  );
  const [cuisine, setCuisine] = useState(restaurant?.cuisine ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [closed, setClosed] = useState<Record<number, boolean>>(
    Object.fromEntries(
      DAYS.map((_, weekday) => {
        const hours = openingHours.find((row) => row.weekday === weekday);
        return [weekday, hours?.is_closed ?? false];
      }),
    ),
  );

  const profileErrors =
    profileState && !profileState.ok && profileState.code === "validation"
      ? profileState.fieldErrors
      : {};

  return (
    <div className="mt-6 space-y-8">
      <form
        action={async (formData) => {
          await profileAction(formData);
          router.refresh();
        }}
        noValidate
        className="rounded-xl border border-line bg-white p-5 sm:p-6"
      >
        <h2 className="text-xl font-bold">Profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            name="name"
            label="Restaurant name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={profileErrors.name?.[0]}
          />
          <div>
            <label
              htmlFor="neighborhood"
              className="block text-sm font-bold text-ink"
            >
              Neighborhood
            </label>
            <select
              id="neighborhood"
              name="neighborhood"
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              aria-invalid={profileErrors.neighborhood ? true : undefined}
              aria-describedby={
                profileErrors.neighborhood ? "neighborhood-error" : undefined
              }
              className={`${fieldControlClass} mt-1`}
              required
            >
              {NEIGHBORHOODS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {profileErrors.neighborhood?.[0] && (
              <p id="neighborhood-error" className="mt-1 text-sm text-danger">
                {profileErrors.neighborhood[0]}
              </p>
            )}
          </div>
          <Field
            name="cuisine"
            label="Cuisine"
            required
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
            error={profileErrors.cuisine?.[0]}
          />
          <Field
            name="address"
            label="Address"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            error={profileErrors.address?.[0]}
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-bold text-ink"
            >
              Short description
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={profileErrors.description ? true : undefined}
              aria-describedby={
                profileErrors.description ? "description-error" : undefined
              }
              className={`${fieldControlClass} mt-1 min-h-24 resize-y`}
            />
            {profileErrors.description?.[0] && (
              <p id="description-error" className="mt-1 text-sm text-danger">
                {profileErrors.description[0]}
              </p>
            )}
          </div>
        </div>

        <h3 className="mt-8 text-lg font-bold">Opening hours</h3>
        <div className="mt-3 divide-y divide-line border-y border-line">
          {DAYS.map((day, weekday) => {
            const hours = openingHours.find((row) => row.weekday === weekday);
            const isClosed = closed[weekday] ?? hours?.is_closed ?? false;
            return (
              <div
                key={day}
                className="grid items-end gap-3 py-3 sm:grid-cols-[140px_1fr_1fr_100px]"
              >
                <p className="font-bold">{day}</p>
                <Field
                  name={`open_${weekday}`}
                  label="Open"
                  type="time"
                  defaultValue={hours?.open_time?.slice(0, 5) ?? "11:00"}
                  disabled={isClosed}
                  error={
                    profileErrors[
                      `day_${weekday}_open` as keyof typeof profileErrors
                    ]?.[0]
                  }
                />
                <Field
                  name={`close_${weekday}`}
                  label="Close"
                  type="time"
                  defaultValue={hours?.close_time?.slice(0, 5) ?? "22:00"}
                  disabled={isClosed}
                  error={
                    profileErrors[
                      `day_${weekday}_close` as keyof typeof profileErrors
                    ]?.[0]
                  }
                />
                <label className="flex items-center gap-2 pb-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={(event) =>
                      setClosed((current) => ({
                        ...current,
                        [weekday]: event.target.checked,
                      }))
                    }
                  />
                  Closed
                  <input
                    type="hidden"
                    name={`closed_${weekday}`}
                    value={isClosed ? "true" : "false"}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-4">
          {profileState &&
            !profileState.ok &&
            profileState.code === "error" && (
              <p role="alert" className="text-sm font-bold text-danger">
                {profileState.message}
              </p>
            )}
          {profileState?.ok && (
            <p className="text-sm font-bold text-brand">
              {profileState.message}
            </p>
          )}
        </div>
        <Button type="submit" className="mt-4" disabled={profilePending}>
          {profilePending ? "Saving…" : "Save profile and hours"}
        </Button>
      </form>

      <TablesSection tables={tables} />
    </div>
  );
}

function TablesSection({ tables }: { tables: TableRow[] }) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState<
    TableActionState,
    FormData
  >(addTableAction, null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, editAction, editPending] = useActionState<
    TableActionState,
    FormData
  >(editTableAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState<
    TableActionState,
    FormData
  >(deleteTableAction, null);
  const addErrors =
    addState && !addState.ok && addState.code === "validation"
      ? addState.fieldErrors
      : {};
  const editErrors =
    editState && !editState.ok && editState.code === "validation"
      ? editState.fieldErrors
      : {};

  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold">Tables</h2>
      {tables.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No tables yet. Add your first table so guests can make a booking.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-line">
          {tables.map((table) => (
            <div key={table.id} className="py-3">
              {editingId === table.id ? (
                <form
                  action={async (formData) => {
                    await editAction(formData);
                    setEditingId(null);
                    router.refresh();
                  }}
                  className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"
                >
                  <input type="hidden" name="table_id" value={table.id} />
                  <Field
                    name="label"
                    label="Table label"
                    defaultValue={table.label}
                    error={editErrors.label?.[0]}
                  />
                  <Field
                    name="capacity"
                    label="Seats"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={table.capacity}
                    error={editErrors.capacity?.[0]}
                  />
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={editPending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p>
                    <span className="font-bold">{table.label}</span>
                    <span className="ml-2 text-muted">
                      {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingId(table.id)}
                    >
                      Edit
                    </Button>
                    <form
                      action={deleteAction}
                      onSubmit={(event) => {
                        if (
                          !window.confirm(
                            `Delete ${table.label}? This may affect future reservations.`,
                          )
                        ) {
                          event.preventDefault();
                          return;
                        }
                        const confirmed =
                          event.currentTarget.elements.namedItem(
                            "confirmed",
                          ) as HTMLInputElement;
                        confirmed.value = "true";
                      }}
                    >
                      <input type="hidden" name="table_id" value={table.id} />
                      <input type="hidden" name="confirmed" value="false" />
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={deletePending}
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        action={async (formData) => {
          await addAction(formData);
          router.refresh();
        }}
        noValidate
        className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_150px_auto]"
      >
        <Field
          name="label"
          label="New table label"
          placeholder="Patio 1"
          required
          error={addErrors.label?.[0]}
        />
        <Field
          name="capacity"
          label="Seats"
          type="number"
          min={1}
          max={20}
          required
          error={addErrors.capacity?.[0]}
        />
        <div className="flex items-end">
          <Button type="submit" disabled={addPending}>
            {addPending ? "Adding…" : "Add table"}
          </Button>
        </div>
      </form>

      <div aria-live="polite" className="mt-3">
        {[addState, editState, deleteState].map((state, index) =>
          state?.ok ? (
            <p key={index} className="text-sm font-bold text-brand">
              {state.message}
            </p>
          ) : state?.code === "error" || state?.code === "confirmation" ? (
            <p
              key={index}
              role="alert"
              className="text-sm font-bold text-danger"
            >
              {state.message}
            </p>
          ) : null,
        )}
      </div>
    </section>
  );
}
