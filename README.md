# TableNook

Free online reservations for small independent restaurants in the fictional city
of Maple Bay. Guests search, book a table without an account and get a confirmation
email; restaurant owners sign up, set up their restaurant and tables, and see
bookings live.

**Live demo:** https://local-reservations.vercel.app/
**Scrum board:** https://github.com/users/Joynana5/projects/12
**Docs:** [PRD](docs/PRD.md) · [Design](docs/DESIGN.md) · [Sprint 1](docs/sprints/sprint-1.md) · [Sprint 2](docs/sprints/sprint-2.md)

## Features
- Search by neighborhood, date, time and party size with live availability
- Booking with server-side re-check; no double bookings (DB exclusion constraint)
- Confirmation email (Resend) with a manage link; guest cancellation
- Restaurant sign-up/login, setup (profile, hours, tables), live reservation dashboard

## Tech stack
Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, RLS) ·
Resend · Zod · Vitest · Playwright · Vercel

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase and Resend keys
3. Apply `supabase/migrations/` and `supabase/seed.sql` in your Supabase project
4. `npm run dev` → http://localhost:3000

## Tests
- `npm run test` — unit tests (Vitest)
- `npx playwright test` — e2e; tests that write bookings need `E2E_ALLOW_BOOKING_WRITES=1`

## AI-assisted development
Built with GitHub Copilot (Agent mode). `AGENTS.md` holds the project rules: stack,
architecture, conventions, Git workflow and security rules. Each issue was
implemented from a short prompt, and the agent posted a self-review on every PR.
