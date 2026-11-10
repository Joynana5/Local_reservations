import { createClient } from '@supabase/supabase-js';
import 'server-only';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  address: string;
  description: string;
  avg_turn_minutes: number;
  created_at: string;
}

export interface OpeningHours {
  id: string;
  restaurant_id: string;
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface Table {
  id: string;
  restaurant_id: string;
  label: string;
  capacity: number;
}

export interface Reservation {
  id: string;
  table_id: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'seated' | 'no_show' | 'cancelled';
}

export async function getRestaurants(
  neighborhood?: string
): Promise<Restaurant[]> {
  let query = supabase.from('restaurants').select('*');

  if (neighborhood) {
    query = query.eq('neighborhood', neighborhood);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch restaurants: ${error.message}`);
  }

  return data || [];
}

export async function getRestaurantWithDetails(
  restaurantId: string
): Promise<{
  restaurant: Restaurant;
  openingHours: OpeningHours[];
  tables: Table[];
} | null> {
  const [restaurantRes, hoursRes, tablesRes] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
    supabase.from('opening_hours').select('*').eq('restaurant_id', restaurantId),
    supabase.from('tables').select('*').eq('restaurant_id', restaurantId),
  ]);

  if (restaurantRes.error) {
    throw new Error(`Failed to fetch restaurant: ${restaurantRes.error.message}`);
  }
  if (hoursRes.error) {
    throw new Error(`Failed to fetch opening hours: ${hoursRes.error.message}`);
  }
  if (tablesRes.error) {
    throw new Error(`Failed to fetch tables: ${tablesRes.error.message}`);
  }

  if (!restaurantRes.data) {
    return null;
  }

  return {
    restaurant: restaurantRes.data,
    openingHours: hoursRes.data || [],
    tables: tablesRes.data || [],
  };
}

export async function getReservationsForRestaurant(
  restaurantId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<Reservation[]> {
  const reservations: Reservation[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, table_id, starts_at, ends_at, status')
      .eq('restaurant_id', restaurantId)
      .in('status', ['confirmed', 'seated'])
      .lt('starts_at', endsAt.toISOString())
      .gt('ends_at', startsAt.toISOString())
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (error) {
      throw new Error(`Failed to fetch reservations: ${error.message}`);
    }
    reservations.push(...data);
    if (data.length < pageSize) return reservations;
  }
}

export async function getUniqueNeighborhoods(): Promise<string[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('neighborhood')
    .order('neighborhood', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch neighborhoods: ${error.message}`);
  }

  const neighborhoods = new Set(
    (data || []).map((row: Record<string, unknown>) => row.neighborhood as string)
  );
  return Array.from(neighborhoods);
}
