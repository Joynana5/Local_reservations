-- TableNook — Maple Bay demo data (issue #2)
-- Safe to re-run: removes only demo restaurants (owner_id is null) and everything attached to them.
-- Times: Maple Bay uses the America/Los_Angeles time zone.

delete from public.reservations where restaurant_id in (select id from public.restaurants where owner_id is null);
delete from public.restaurants where owner_id is null;

-- Restaurants (fixed ids so the seed is repeatable) ---------------------------
insert into public.restaurants (id, name, neighborhood, cuisine, address, description, avg_turn_minutes) values
  ('00000000-0000-0000-0000-000000000001', 'Nonna Rosa''s',         'Riverside',  'Italian',       '8 Mill Lane, Maple Bay',       'A 12-table family kitchen with handmade pasta and Sunday ragù every day.', 60),
  ('00000000-0000-0000-0000-000000000002', 'Tidewater Taqueria',    'Old Harbor', 'Mexican',       '3 Harbor Wall, Maple Bay',     'Fish tacos, aguas frescas and a patio by the harbor wall.', 45),
  ('00000000-0000-0000-0000-000000000003', 'Gull & Galley',         'Old Harbor', 'Seafood',       '14 Wharf Street, Maple Bay',   'Chowder, grilled catch of the day and a window on the fishing boats.', 60),
  ('00000000-0000-0000-0000-000000000004', 'Lantern Noodle House',  'Midtown',    'Chinese',       '120 Main Street, Maple Bay',   'Hand-pulled noodles and dumplings, open late.', 40),
  ('00000000-0000-0000-0000-000000000005', 'Saffron & Salt',        'Midtown',    'Indian',        '45 Station Road, Maple Bay',   'Tandoor breads, slow curries and a small courtyard.', 50),
  ('00000000-0000-0000-0000-000000000006', 'The Hillcrest Hearth',  'Hillcrest',  'American',      '2 Ridge Avenue, Maple Bay',    'Wood-fired bistro plates with a view over the bay.', 60),
  ('00000000-0000-0000-0000-000000000007', 'Mezze on Maple',        'Hillcrest',  'Mediterranean', '67 Maple Avenue, Maple Bay',   'Sharing plates, grilled meats and plenty of vegetarian dishes.', 45),
  ('00000000-0000-0000-0000-000000000008', 'Riverbend Café',        'Riverside',  'Brunch',        '19 Riverbend Walk, Maple Bay', 'Pancakes, eggs and good coffee by the river.', 40);

-- Opening hours: weekday 0 = Sunday … 6 = Saturday --------------------------
insert into public.opening_hours (restaurant_id, weekday, open_time, close_time, is_closed)
select r.id::uuid, d, r.open_t::time, r.close_t::time, d = any (r.closed_days)
from (values
  ('00000000-0000-0000-0000-000000000001', '16:30', '22:00', array[1]),    -- closed Monday
  ('00000000-0000-0000-0000-000000000002', '11:30', '21:00', array[]::int[]),
  ('00000000-0000-0000-0000-000000000003', '17:00', '22:00', array[]::int[]),
  ('00000000-0000-0000-0000-000000000004', '11:00', '22:00', array[2]),    -- closed Tuesday
  ('00000000-0000-0000-0000-000000000005', '17:00', '22:30', array[]::int[]),
  ('00000000-0000-0000-0000-000000000006', '17:00', '21:30', array[0, 1]), -- closed Sunday and Monday
  ('00000000-0000-0000-0000-000000000007', '12:00', '22:00', array[]::int[]),
  ('00000000-0000-0000-0000-000000000008', '08:00', '15:00', array[1])     -- closed Monday
) as r (id, open_t, close_t, closed_days)
cross join generate_series(0, 6) as d;

-- Tables: labels T1…Tn with the listed capacities ---------------------------
insert into public.tables (restaurant_id, label, capacity)
select r.id::uuid, 'T' || t.n, t.cap
from (values
  ('00000000-0000-0000-0000-000000000001', array[2, 2, 4, 4, 6, 2, 2, 4, 4, 4, 6, 8]), -- 12 tables
  ('00000000-0000-0000-0000-000000000002', array[2, 2, 4, 4, 6]),
  ('00000000-0000-0000-0000-000000000003', array[2, 2, 2, 4, 4, 6, 8]),                 -- largest table 8
  ('00000000-0000-0000-0000-000000000004', array[2, 2, 2, 4, 4, 4, 6, 10]),
  ('00000000-0000-0000-0000-000000000005', array[2, 4, 4, 6]),
  ('00000000-0000-0000-0000-000000000006', array[2, 2, 4, 4, 6, 6]),
  ('00000000-0000-0000-0000-000000000007', array[2, 2, 4, 4, 4, 8, 12]),
  ('00000000-0000-0000-0000-000000000008', array[2, 2, 2, 4])
) as r (id, caps)
cross join lateral unnest(r.caps) with ordinality as t (cap, n);

-- Today's reservations at Nonna Rosa's (matches the R3 mockup) ---------------
insert into public.reservations (restaurant_id, table_id, guest_name, guest_phone, guest_email, party_size, starts_at, ends_at, status)
select '00000000-0000-0000-0000-000000000001',
       (select id from public.tables where restaurant_id = '00000000-0000-0000-0000-000000000001' and label = v.label),
       v.guest, v.phone, v.email, v.party,
       (((now() at time zone 'America/Los_Angeles')::date + v.start_t::time) at time zone 'America/Los_Angeles'),
       (((now() at time zone 'America/Los_Angeles')::date + v.start_t::time) at time zone 'America/Los_Angeles') + interval '90 minutes',
       v.status
from (values
  ('T1', 'Priya Natarajan', '555-0101', 'priya@example.com',  2, '17:00', 'seated'),
  ('T5', 'Daniel Ortiz',    '555-0102', 'daniel@example.com', 6, '17:30', 'seated'),
  ('T3', 'Lena Fischer',    '555-0103', 'lena@example.com',   3, '18:00', 'no_show'),
  ('T4', 'Mei Chen',        '555-0104', 'mei@example.com',    4, '18:30', 'confirmed'),
  ('T2', 'Sam Okafor',      '555-0105', 'sam@example.com',    2, '19:00', 'confirmed'),
  ('T1', 'Maya Brooks',     '555-0106', 'maya@example.com',   2, '19:30', 'confirmed'),
  ('T5', 'Tom Reyes',       '555-0107', 'tom@example.com',    5, '20:00', 'cancelled')
) as v (label, guest, phone, email, party, start_t, status);
