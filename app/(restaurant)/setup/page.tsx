import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SetupForm } from "@/components/restaurant/setup-form";

export default async function SetupPage() {
  const user = await getSignedInUser();
  if (!user) redirect(LOGIN_PATH);

  const supabase = await createServerSupabaseClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood, cuisine, address, description")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (restaurantError) {
    throw new Error("We couldn't load your restaurant setup.");
  }

  const [hoursResult, tablesResult] = restaurant
    ? await Promise.all([
        supabase
          .from("opening_hours")
          .select("weekday, open_time, close_time, is_closed")
          .eq("restaurant_id", restaurant.id)
          .order("weekday"),
        supabase
          .from("tables")
          .select("id, label, capacity")
          .eq("restaurant_id", restaurant.id)
          .order("label"),
      ])
    : [
        { data: null, error: null },
        { data: null, error: null },
      ];
  if (hoursResult.error || tablesResult.error) {
    throw new Error("We couldn't load your restaurant setup.");
  }

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Set up your restaurant
      </h1>
      <SetupForm
        restaurant={
          restaurant
            ? {
                name: restaurant.name,
                neighborhood: restaurant.neighborhood,
                cuisine: restaurant.cuisine,
                address: restaurant.address,
                description: restaurant.description,
              }
            : null
        }
        openingHours={hoursResult.data ?? []}
        tables={tablesResult.data ?? []}
      />
    </main>
  );
}
