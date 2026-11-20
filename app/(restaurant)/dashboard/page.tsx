import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import { LOGIN_PATH, SETUP_PATH } from "@/lib/auth/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMapleBayInstant, getMapleBayToday } from "@/lib/search-time";
import { ReservationDashboard } from "@/components/restaurant/reservation-dashboard";
import type { ReservationDashboardRow } from "@/lib/reservation-dashboard";

export default async function DashboardPage() {
  const user = await getSignedInUser();
  if (!user) redirect(LOGIN_PATH);

  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (restaurantError) {
    throw new Error("We couldn't load your restaurant.");
  }
  if (!restaurant) redirect(SETUP_PATH);

  const today = getMapleBayToday();
  const [year, month, day] = today.split("-").map(Number);
  const tomorrowDate = new Date(Date.UTC(year, month - 1, day + 1));
  const tomorrow = [
    String(tomorrowDate.getUTCFullYear()).padStart(4, "0"),
    String(tomorrowDate.getUTCMonth() + 1).padStart(2, "0"),
    String(tomorrowDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const todayStart = getMapleBayInstant(today, "00:00").startsAt;
  const tomorrowStart = getMapleBayInstant(tomorrow, "00:00").startsAt;

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, restaurant_id, table_id, guest_name, party_size, starts_at, status, tables(label)",
    )
    .eq("restaurant_id", restaurant.id)
    .gte("starts_at", todayStart.toISOString())
    .order("starts_at", { ascending: true });
  if (error) {
    throw new Error("We couldn't load reservations.");
  }

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(todayStart);

  return (
    <ReservationDashboard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      dateLabel={dateLabel}
      todayStart={todayStart.toISOString()}
      tomorrowStart={tomorrowStart.toISOString()}
      initialReservations={(data ?? []) as ReservationDashboardRow[]}
    />
  );
}
