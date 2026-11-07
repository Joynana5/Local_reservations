-- TableNook — initial schema with Row Level Security (issue #1)
-- Data model: docs/PRD.md §9. Security: PRD §8.
-- Run once in Supabase → SQL Editor (or with the Supabase CLI).

-- Extensions --------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;   -- random tokens
create extension if not exists btree_gist with schema extensions; -- double-booking constraint

-- Long, random, unguessable token for guest links (manage / status pages)
create or replace function public.generate_token()
returns text language sql volatile set search_path = ''
as $$ select encode(extensions.gen_random_bytes(32), 'hex') $$;

-- Tables ------------------------------------------------------------------
create table public.restaurants (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid unique references auth.users (id) on delete cascade, -- null = seeded demo restaurant
  name             text not null,
  neighborhood     text not null check (neighborhood in ('Old Harbor', 'Riverside', 'Midtown', 'Hillcrest')),
  cuisine          text not null,
  address          text not null,
  description      text not null default '',
  avg_turn_minutes int  not null default 45 check (avg_turn_minutes > 0),
  created_at       timestamptz not null default now()
);

create table public.opening_hours (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6), -- 0 = Sunday (same as JS Date.getDay())
  open_time     time,
  close_time    time,
  is_closed     boolean not null default false,
  unique (restaurant_id, weekday),
  check (is_closed or (open_time is not null and close_time is not null and close_time > open_time))
);

create table public.tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  label         text not null,
  capacity      int  not null check (capacity between 1 and 20),
  unique (restaurant_id, label)
);

create table public.reservations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id      uuid not null references public.tables (id) on delete restrict, -- app must handle future bookings before deleting a table (US-3)
  guest_name    text not null,
  guest_phone   text not null,
  guest_email   text not null,
  party_size    int  not null check (party_size between 1 and 20),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        text not null default 'confirmed' check (status in ('confirmed', 'seated', 'no_show', 'cancelled')),
  manage_token  text not null unique default public.generate_token(),
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at),
  -- FR-7: the database itself refuses two active reservations on the same table at overlapping times
  constraint no_double_booking exclude using gist (
    table_id with =,
    (tstzrange(starts_at, ends_at, '[)')) with &&
  ) where (status in ('confirmed', 'seated'))
);

create table public.waitlist_entries (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  guest_name    text not null,
  guest_phone   text not null,
  guest_email   text not null,
  party_size    int  not null check (party_size between 1 and 20),
  joined_at     timestamptz not null default now(),
  status        text not null default 'waiting' check (status in ('waiting', 'called', 'seated', 'removed', 'left')),
  status_token  text not null unique default public.generate_token()
);

create index reservations_restaurant_time_idx on public.reservations (restaurant_id, starts_at);
create index waitlist_restaurant_status_idx  on public.waitlist_entries (restaurant_id, status, joined_at);

-- Row Level Security --------------------------------------------------------
-- Guests never touch reservations or waitlist rows directly: booking, availability checks and
-- token pages run on the server with the secret key. Owners see and change only their own data.

create or replace function public.owns_restaurant(rid uuid)
returns boolean language sql stable set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = rid and r.owner_id = (select auth.uid())
  )
$$;

alter table public.restaurants      enable row level security;
alter table public.opening_hours    enable row level security;
alter table public.tables           enable row level security;
alter table public.reservations     enable row level security;
alter table public.waitlist_entries enable row level security;

-- restaurants: public profile, owner manages it
create policy "Anyone can read restaurants" on public.restaurants
  for select to anon, authenticated using (true);
create policy "Owner creates own restaurant" on public.restaurants
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owner updates own restaurant" on public.restaurants
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owner deletes own restaurant" on public.restaurants
  for delete to authenticated using (owner_id = (select auth.uid()));

-- opening_hours and tables: public read (needed for search), owner writes
create policy "Anyone can read opening hours" on public.opening_hours
  for select to anon, authenticated using (true);
create policy "Owner manages opening hours" on public.opening_hours
  for all to authenticated
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

create policy "Anyone can read tables" on public.tables
  for select to anon, authenticated using (true);
create policy "Owner manages tables" on public.tables
  for all to authenticated
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

-- reservations and waitlist: guest contact data, visible only to the owning restaurant
create policy "Owner reads own reservations" on public.reservations
  for select to authenticated using (public.owns_restaurant(restaurant_id));
create policy "Owner updates own reservations" on public.reservations
  for update to authenticated
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

create policy "Owner reads own waitlist" on public.waitlist_entries
  for select to authenticated using (public.owns_restaurant(restaurant_id));
create policy "Owner updates own waitlist" on public.waitlist_entries
  for update to authenticated
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

-- Realtime for the owner dashboard (RLS still applies to subscriptions).
-- The guest live status page (Sprint 2) will need its own approach, since guests cannot read these rows.
alter publication supabase_realtime add table public.reservations, public.waitlist_entries;
