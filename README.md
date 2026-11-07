# TableNook

TableNook helps guests discover independent restaurants in Maple Bay and check table availability.

## Getting started

Install dependencies with `npm install`. Apply the migrations in `supabase/migrations` and run `supabase/seed.sql` against your Supabase project. Copy `.env.example` to `.env.local` and set the project URL, publishable key, and server-only secret key. Never expose the secret key to the browser or commit it.

Run `npm run dev`, then open http://localhost:3000. Run unit tests with `npm test` and lint with `npm run lint`.

## Restaurant search

The home page shows restaurants and availability at the next half-hour. Apply the neighborhood, date, time, and party-size filters to show only matching restaurants. Times are in Maple Bay's `America/Los_Angeles` time zone; invalid or ambiguous local times during daylight-saving transitions are rejected.

An available start time must be in opening hours and in the future, with a table large enough for the party. Confirmed and seated reservations block their table for their stored interval; the searched reservation would occupy it for 90 minutes. Cancelled and no-show reservations do not block availability. Availability is informational and can change; booking is not implemented yet.

The server uses `SUPABASE_SECRET_KEY` to check reservations because guest access to reservation rows is blocked by RLS. Only table and timing fields are read, and no guest information or secret key is sent to the page. Ensure the secret key is available only in the server environment.
