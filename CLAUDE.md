# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` (imported above) is the source of truth for workflow, stack versions, domain rules, naming, and do's/don'ts. Product requirements are in `docs/PRD.md` and the UI spec is in `docs/DESIGN.md`. The API contract is in `docs/openapi.yaml`. This file only adds commands and notes on where the code differs from AGENTS.md.

## Commands

```bash
npm run dev                 # Next.js dev server (Turbopack), http://localhost:3000
npm run lint                # ESLint
npx tsc --noEmit            # typecheck (CI runs this after lint)
npm run test                # Vitest, all **/*.test.{ts,tsx} (e2e/ excluded)
npx vitest run lib/availability.test.ts      # single test file
npx vitest run -t "name of test"             # single test by name
npx vitest run app/api                       # integration tests against real Supabase
npm run build               # production build
npm run test:e2e            # Playwright; starts its own dev server on port 3101
npx playwright test e2e/booking.e2e.ts       # single e2e spec
```

- Integration tests (`*.integration.test.ts`) skip on their own when no DB env is set. Tests that write data run only with `INTEGRATION_ALLOW_WRITES=1`. E2E booking writes need `E2E_ALLOW_BOOKING_WRITES=1`. CI sets neither flag, so the tests stay read-only.
- Playwright starts the dev server with `RESEND_API_KEY=""`, so the email sender skips and sends nothing. Set `PLAYWRIGHT_BASE_URL` to test against a deployed URL instead.
- CI (`.github/workflows/ci.yml`) runs these stages in order: lint + `tsc`, then Vitest, then build, then Playwright. `npm audit --audit-level=high` runs in parallel.
- Env vars are listed in `.env.example`. To set up the DB, run `supabase/migrations/*.sql` in order in the Supabase SQL editor, then `supabase/seed.sql`.

## Architecture as actually implemented

The code differs from the folder layout in AGENTS.md §1.2 in a few places. Follow the existing code unless the issue says to restructure:

- **Availability lives in one file, `lib/availability.ts`,** not in a `lib/availability/` folder. It is pure and holds the slot constants (`SLOT_MINUTES`, `HOLD_MINUTES`), `getAvailableSlots`, `fitsBeforeClosing`, `pickTables` and `getAlternativeSlots`. `lib/waitlist/` does not exist yet, because the waitlist stories US-7–9 are in the backlog. The `waitlist_entries` table is already in the schema.
- **Booking and cancellation use dependency injection.** `lib/booking/create-reservation.ts` and `lib/booking/cancel-reservation.ts` take a repository interface (`BookingRepository`, `CancelRepository`). The Supabase versions are in `lib/booking/supabase-repositories.ts` and call the query helpers in `lib/supabase/admin.ts`. Unit tests pass in fake repositories, so this logic needs no DB.
- **The UI and the public API share the same logic.** Server Actions in `lib/actions/` and route handlers in `app/api/` both call the `lib/booking/*` functions, so they behave the same way. If you change booking rules, check both callers. The API status codes (400 / 409 / 422) are set in `docs/openapi.yaml`.
- **Double booking is blocked twice.** `createReservation` re-checks availability in app code. A Postgres exclusion constraint `no_double_booking` (btree_gist, in the init migration) also rejects overlapping rows. The insert result reports that case as `{ kind: "overlap" }` (SQLSTATE 23P01) and the caller returns a "slot taken" error.
- **Time zone:** Maple Bay uses `America/Los_Angeles`. `lib/search-time.ts` (`getMapleBaySlot`, `getMapleBayInstant`) turns a local date and time into a UTC `Date`. Always use these helpers and never build `Date`s from local strings by hand.
- **Auth:** `proxy.ts` refreshes the Supabase session cookies and sends logged-out users on `/dashboard` and `/setup` to `/login`. The route constants and `isProtectedPath` are in `lib/auth/routes.ts`. Server-side session helpers are in `lib/auth/session.ts`.
- **Search** is a Server Action in `app/actions.ts` (`searchRestaurants`), outside `lib/actions/`. It uses the admin client, as guest flows should.
- **RLS:** all tables have RLS. Owner policies go through the SQL helper `public.owns_restaurant(rid)`. Guests have no RLS write path, so guest writes go through the admin client in `lib/supabase/admin.ts`.
- **Email:** `lib/email/booking-confirmation.ts` builds the template (pure) and `send-booking-confirmation.ts` sends it with Resend. Sending is skipped when `RESEND_API_KEY` is empty.

## Repo hygiene

`IMPLEMENTATION_SUMMARY.md`, `SEARCH_FEATURE_GUIDE.md` and `VERIFICATION_CHECKLIST.md` in the root are leftover agent output. AGENTS.md forbids files like these, so don't create more.
