"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../supabase/server";
import {
  profileSchema,
  openingHourSchema,
  tableSchema,
  type ProfileInput,
  type OpeningHoursInput,
} from "../validation/setup";

export type SetupFieldErrors = Partial<
  Record<keyof ProfileInput, string[]> &
    Record<`day_${number}_open` | `day_${number}_close`, string[]>
>;

export type SetupActionState =
  | { ok: true; message: string }
  | { ok: false; code: "validation"; fieldErrors: SetupFieldErrors }
  | { ok: false; code: "error"; message: string }
  | null;

export type TableActionState =
  | { ok: true; message: string }
  | { ok: false; code: "confirmation"; message: string }
  | {
      ok: false;
      code: "validation";
      fieldErrors: Partial<Record<"label" | "capacity", string[]>>;
    }
  | { ok: false; code: "error"; message: string }
  | null;

async function getOwnerContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return { supabase, user, restaurant };
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveSetupAction(
  _previousState: SetupActionState,
  formData: FormData,
): Promise<SetupActionState> {
  const profile = profileSchema.safeParse({
    name: formText(formData, "name"),
    neighborhood: formText(formData, "neighborhood"),
    cuisine: formText(formData, "cuisine"),
    address: formText(formData, "address"),
    description: formText(formData, "description"),
  });
  if (!profile.success) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: profile.error.flatten().fieldErrors,
    };
  }

  const hours: OpeningHoursInput[] = [];
  const hourFieldErrors: SetupFieldErrors = {};
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const isClosed = formData.get(`closed_${weekday}`) === "true";
    const parsed = openingHourSchema.safeParse({
      weekday,
      isClosed,
      openTime: formText(formData, `open_${weekday}`),
      closeTime: formText(formData, `close_${weekday}`),
    });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      if (errors.openTime?.[0]) {
        hourFieldErrors[`day_${weekday}_open`] = errors.openTime;
      }
      if (errors.closeTime?.[0]) {
        hourFieldErrors[`day_${weekday}_close`] = errors.closeTime;
      }
    } else {
      hours.push(parsed.data);
    }
  }
  if (Object.keys(hourFieldErrors).length > 0) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: hourFieldErrors,
    };
  }

  try {
    const context = await getOwnerContext();
    if (!context) {
      return { ok: false, code: "error", message: "Please log in again." };
    }
    const { supabase, user, restaurant } = context;

    let restaurantId = restaurant?.id;
    if (restaurantId) {
      const { error } = await supabase
        .from("restaurants")
        .update(profile.data)
        .eq("id", restaurantId)
        .eq("owner_id", user.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("restaurants")
        .insert({ ...profile.data, owner_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      restaurantId = data.id;
    }

    const rows = hours.map((hoursForDay) => ({
      restaurant_id: restaurantId,
      weekday: hoursForDay.weekday,
      open_time: hoursForDay.isClosed ? null : hoursForDay.openTime,
      close_time: hoursForDay.isClosed ? null : hoursForDay.closeTime,
      is_closed: hoursForDay.isClosed,
    }));
    const { error: hoursError } = await supabase
      .from("opening_hours")
      .upsert(rows, { onConflict: "restaurant_id,weekday" });
    if (hoursError) throw hoursError;

    revalidatePath("/setup");
    revalidatePath("/search");
    revalidatePath("/");
    return { ok: true, message: "Restaurant profile and hours saved." };
  } catch (cause) {
    console.error(
      "Saving restaurant setup failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      code: "error",
      message: "We couldn't save your setup. Please try again.",
    };
  }
}

export async function addTableAction(
  _previousState: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = tableSchema.safeParse({
    label: formText(formData, "label"),
    capacity: formText(formData, "capacity"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const context = await getOwnerContext();
    if (!context?.restaurant) {
      return {
        ok: false,
        code: "error",
        message: "Save your restaurant profile before adding tables.",
      };
    }
    const { error } = await context.supabase.from("tables").insert({
      restaurant_id: context.restaurant.id,
      label: parsed.data.label,
      capacity: parsed.data.capacity,
    });
    if (error) throw error;
    revalidatePath("/setup");
    revalidatePath("/search");
    return { ok: true, message: "Table added." };
  } catch (cause) {
    console.error(
      "Adding table failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      code: "error",
      message: "We couldn't add the table. Please try again.",
    };
  }
}

export async function editTableAction(
  _previousState: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const tableId = formText(formData, "table_id");
  const parsed = tableSchema.safeParse({
    label: formText(formData, "label"),
    capacity: formText(formData, "capacity"),
  });
  if (!tableId || !parsed.success) {
    return parsed.success
      ? {
          ok: false,
          code: "error",
          message: "We couldn't identify that table.",
        }
      : {
          ok: false,
          code: "validation",
          fieldErrors: parsed.error.flatten().fieldErrors,
        };
  }
  try {
    const context = await getOwnerContext();
    if (!context?.restaurant) {
      return { ok: false, code: "error", message: "Please log in again." };
    }
    const { error } = await context.supabase
      .from("tables")
      .update({ label: parsed.data.label, capacity: parsed.data.capacity })
      .eq("id", tableId)
      .eq("restaurant_id", context.restaurant.id);
    if (error) throw error;
    revalidatePath("/setup");
    revalidatePath("/search");
    return { ok: true, message: "Table updated." };
  } catch (cause) {
    console.error(
      "Editing table failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      code: "error",
      message: "We couldn't update the table. Please try again.",
    };
  }
}

export async function deleteTableAction(
  _previousState: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const tableId = formText(formData, "table_id");
  if (!tableId) {
    return {
      ok: false,
      code: "error",
      message: "We couldn't identify that table.",
    };
  }
  try {
    const context = await getOwnerContext();
    if (!context?.restaurant) {
      return { ok: false, code: "error", message: "Please log in again." };
    }
    const { data: futureReservations, error: futureError } =
      await context.supabase
        .from("reservations")
        .select("id")
        .eq("table_id", tableId)
        .eq("restaurant_id", context.restaurant.id)
        .in("status", ["confirmed", "seated"])
        .gte("starts_at", new Date().toISOString())
        .limit(1);
    if (futureError) throw futureError;

    if (
      (futureReservations?.length ?? 0) > 0 &&
      formData.get("confirmed") !== "true"
    ) {
      return {
        ok: false,
        code: "confirmation",
        message:
          "This table has future reservations. Deleting it will remove the table reference and could affect those bookings.",
      };
    }

    const { error } = await context.supabase
      .from("tables")
      .delete()
      .eq("id", tableId)
      .eq("restaurant_id", context.restaurant.id);
    if (error) throw error;
    revalidatePath("/setup");
    revalidatePath("/search");
    return { ok: true, message: "Table deleted." };
  } catch (cause) {
    console.error(
      "Deleting table failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return {
      ok: false,
      code: "error",
      message: "We couldn't delete the table. Please try again.",
    };
  }
}
