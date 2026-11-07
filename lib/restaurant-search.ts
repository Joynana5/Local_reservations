import "server-only";
import { createClient } from "@supabase/supabase-js";
import { calculateAvailability, type DiningTable, type Filters, type OpeningHours, type Reservation, type Restaurant } from "./search";

const PAGE_SIZE = 1000;

async function allPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ;) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) {
      const message = error.message.trimStart().startsWith("<")
        ? "unexpected HTML response"
        : error.message.slice(0, 300);
      throw new Error(`Supabase search query failed: ${message}`);
    }
    if (!data) throw new Error("Supabase search query returned no data.");
    rows.push(...data);
    if (data.length === 0) return rows;
    from += data.length;
  }
}

export async function searchRestaurants(filters: Filters) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be configured on the server.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const weekday = new Date(`${filters.date}T00:00:00Z`).getUTCDay();
  const end = new Date(filters.startsAt.getTime() + 90 * 60 * 1000).toISOString();
  const [restaurants, hours, tables, reservations] = await Promise.all([
    allPages<Restaurant>((from, to) => {
      let query = supabase.from("restaurants").select("id,name,neighborhood,cuisine,address,description").order("id").range(from, to);
      if (filters.neighborhood) query = query.eq("neighborhood", filters.neighborhood);
      return query;
    }),
    allPages<OpeningHours>((from, to) => supabase.from("opening_hours").select("restaurant_id,open_time,close_time,is_closed").eq("weekday", weekday).order("id").range(from, to)),
    allPages<DiningTable>((from, to) => supabase.from("tables").select("id,restaurant_id,capacity").gte("capacity", filters.partySize).order("id").range(from, to)),
    allPages<Reservation>((from, to) => supabase.from("reservations").select("table_id,starts_at,ends_at,status").in("status", ["confirmed", "seated"]).lt("starts_at", end).gt("ends_at", filters.startsAt.toISOString()).order("id").range(from, to)),
  ]);
  return calculateAvailability(restaurants, hours, tables, reservations, filters).sort((a, b) => a.name.localeCompare(b.name));
}
