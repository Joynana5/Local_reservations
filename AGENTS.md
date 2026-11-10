# AGENTS.md — TableNook

<!-- Rules file for AI coding agents (Antigravity, Claude Code, Copilot). Read at the start of every session.
     Keep it short: details live in docs/PRD.md (requirements) and docs/DESIGN.md (UI). Change it via PR.
     v1.1 (after the before/after test on issue #6): stricter design step, exact file paths, closing-time rule,
     self-check before finishing, no unrequested docs/config changes, test naming rules. -->

## 0. How to work on this repo (read first)

<!-- A fixed workflow stops the agent from coding before it understands the task. -->

1. Every task starts from a **GitHub Issue**. If you cannot open the issue, use the matching user story and acceptance criteria in `docs/PRD.md` §6.
2. Read the related user story, FR-x and user flow in `docs/PRD.md`.
3. **Before any UI task, read `docs/DESIGN.md`.** Your plan must name the DESIGN.md sections, color tokens and shared components you will use for the screen ID (e.g. G1).
4. Reply with a short plan before coding: exact file paths (see §1.2), and how each acceptance criterion will be met and tested.
5. If something is ambiguous or not in the PRD, **ask** instead of inventing behavior.
6. Implement only what the issue asks for. **Before finishing, run `npm run lint`, `npm run test` and `npm run build` and fix every error.**
7. Finish with a short chat summary: changed files + a checklist of covered acceptance criteria.
8. When talking to me start with ❤ and end with 👍


---

## 1. Project context

TableNook: guests search small independent restaurants, book a table or join a live waitlist without an account; restaurant owners manage profile, hours, tables, reservations and waitlist. All data is demo data for the fictional city **Maple Bay** (Old Harbor, Riverside, Midtown, Hillcrest).

### 1.1 Tech stack (exact pinned versions)

<!-- Pinned on purpose (PRD §9). Agents must not upgrade "while they are at it". -->

- `next` 16.4.3 (App Router, Turbopack) · `react` / `react-dom` 19.3.0 · `typescript` 5.9.3 (strict)
- `tailwindcss` 4.3.3 + `@tailwindcss/turbopack` 4.3.3
- `@supabase/supabase-js` 2.118.0 + `@supabase/ssr` 0.12.7 (Postgres, Auth, Realtime)
- `zod` 4.6.7 · `resend` 6.37.0
- `vitest` 5.0.5 · `@playwright/test` 1.64.1
- `eslint` 9.39.5 + `eslint-config-next` 16.4.3 · `prettier` 3.9.10 · hosting: Vercel (free tier)

Version-specific rules:
- **Next.js 16:** route protection lives in `proxy.ts` (not `middleware.ts`). Dynamic `params` / `searchParams` are Promises — `await` them.
- **Tailwind v4:** configured in CSS (`@import "tailwindcss";` + theme tokens in `app/globals.css`). No `tailwind.config.js`.
- **Zod 4:** use top-level validators (`z.email()`, `z.uuid()`), not `z.string().email()`.
- **React 19:** forms use Server Actions with `useActionState`; no form libraries.

Scripts: `npm run dev | build | lint | test | test:e2e | format`.

### 1.2 Architecture and folder structure

<!-- Target structure; the repo has only the Next.js scaffold now. Create folders as features need them. -->

```
app/
  (guest)/           # public pages, no login (routes in §2), e.g. (guest)/search/page.tsx
  (restaurant)/      # owner pages, protected by proxy.ts except login/signup
  layout.tsx  globals.css
components/
  ui/                # shared: Button, Field, Badge, Tabs, EmptyState… (see DESIGN.md §2)
  guest/  restaurant/
lib/
  supabase/          # client.ts (browser), server.ts (server + cookies) — never a single lib/supabase.ts
  availability/      # slot generation + availability check (pure functions), e.g. availability/slots.ts
  waitlist/          # position + wait estimate (pure functions)
  validation/        # Zod schemas shared by forms and Server Actions, e.g. validation/search.ts
  email/             # Resend wrappers + templates
  actions/           # Server Actions ("use server")
supabase/            # migrations/ (schema + RLS), seed.sql (Maple Bay data)
e2e/                 # Playwright specs
docs/                # PRD.md, DESIGN.md, mockups/
```

Key patterns:
- **Server Components by default;** `"use client"` only for interactivity or Realtime subscriptions.
- **Mutations go through Server Actions:** parse with Zod → check auth/ownership → call Supabase → return `{ ok: true, data }` or `{ ok: false, fieldErrors }`.
- **Business logic is pure and lives in `lib/`**, never inside components.
- **Realtime** subscriptions live in client components and always unsubscribe on unmount.

Supabase clients (§1.2 `lib/supabase/`):
- **Admin client** (`admin.ts`): secret key, server-only, for guest flows (search, availability checks).
- **Server client** (`server.ts`): @supabase/ssr with cookies, for restaurant-owner flows with Row Level Security (RLS).
- **Browser client** (`client.ts`): publishable key, for client-side interactions.
- **Rule:** Guest flows use the admin client; owner flows must use the server client so RLS applies. Never use the admin client for owner data.

### 1.3 Domain rules (from PRD — do not change without a PRD update)

<!-- Where an agent without context guesses wrong most often. -->

- 30-minute slots; a reservation holds a table for **90 minutes** (FR-6).
- A slot is available if at least one table with `capacity >= party_size` has no overlapping reservation (FR-6).
- Slots exist only inside opening hours; closed days have none (FR-3). **A booking must end by closing time: last slot = closing − 90 min** (e.g. closes 22:00 → last slot 20:30).
- Table capacity **1–20** (FR-4).
- The server **re-checks availability before saving**, in a transaction or DB constraint (FR-7). Target: 0 double bookings.
- Wait estimate = (parties ahead ÷ tables that fit the party) × average turn time, default **45 min** (FR-11).
- Statuses — reservation: `confirmed | seated | no_show | cancelled`; waitlist: `waiting | called | seated | removed | left`.
- Times stored as `timestamptz` (UTC), shown in restaurant local time. Data model: PRD §9.

### 1.4 Naming conventions and code style

| What | Convention | Example |
|---|---|---|
| Files, folders | kebab-case | `booking-form.tsx` |
| Components | PascalCase named export | `export function BookingForm()` |
| Functions, variables | camelCase, verb-first functions | `getAvailableSlots` |
| Types / Zod schemas | PascalCase / camelCase | `Reservation`, `reservationSchema` |
| Server Actions | verb + noun + `Action` | `createReservationAction` |
| DB tables, columns | snake_case (PRD §9) | `party_size` |
| Tests | `*.test.ts` next to the file; `e2e/<flow>.spec.ts` | `availability.test.ts` |

- No `any` (use `unknown` + Zod). Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`).
- Prettier formats everything; ESLint passes with 0 errors before a PR.

### 1.5 Testing strategy

<!-- PRD §4: ≥70% coverage on booking and waitlist logic. -->

- **Vitest** for `lib/` (availability, wait estimate, Zod schemas); coverage **≥70%** on `lib/availability` and `lib/waitlist`.
- Every feature PR tests **each testable acceptance criterion** of its issue. A test's name must describe what it asserts.
- Availability edge cases: overlapping 90-min holds, a booking that would run past closing, party bigger than every table, closed day, two bookings racing for the last table.
- Coverage: `npx vitest run --coverage` (add `@vitest/coverage-v8`); report the % for `lib/availability` and `lib/waitlist` in the PR.
- **Playwright** for main flows: guest booking, restaurant onboarding, guest cancellation (waitlist in Sprint 2). Files: `e2e/<flow>.spec.ts`.
- Use seeded Maple Bay data or fixtures — never real personal data.

---

## 2. PRD and design references

<!-- Bridges planning docs to code: every screen ID maps to one route. Visual details live in DESIGN.md. -->

- Requirements: `docs/PRD.md` (US-1…US-10 with acceptance criteria, FR-1…FR-14, user flows §10).
- **Design: `docs/DESIGN.md`** — colors, typography, shared components, and a text description of every screen.
- Mockup images: `docs/mockups/` (`h0-start`, `g1-search`, `g2-restaurant`, `r1-auth`, `r3-reservations`).

| ID | Screen | Route |
|---|---|---|
| H0 | Start (landing) | `/` |
| G1 | Search | `/search` |
| G2 | Restaurant page | `/restaurants/[id]` |
| G3 | Booking form | `/restaurants/[id]/book` |
| G4 | Booking confirmation | `/bookings/[token]/confirmed` |
| G5 | Join waitlist | `/restaurants/[id]/waitlist` |
| G6 | Waitlist status | `/waitlist/[token]` |
| G7 | Manage booking | `/bookings/[token]` |
| R1 | Log in / Sign up | `/login`, `/signup` |
| R2 | Setup | `/setup` |
| R3 | Dashboard — Reservations | `/dashboard` |
| R4 | Dashboard — Waitlist | `/dashboard/waitlist` |

Design rules:
- Use these routes exactly; email links and tests depend on them.
- Use the color tokens and shared components from DESIGN.md; don't invent new styles per page.
- Every screen has **loading, empty and error** states.
- User flows (PRD §10) must work end to end, e.g. H0 → G1 → G2 → G3 → G4 + email.

---

## 3. Scrum and Git workflow

<!-- Ties every change to a GitHub Issue so AI-generated work stays traceable. -->

- **One issue = one branch = one PR.** Milestones: Sprint 1, Sprint 2.
- **Branch:** `<type>/<issue-number>-<short-description>`; types `feature | fix | chore | docs | test`. Example: `feature/7-booking-form`.
- **Commit:** Conventional Commits with the issue number, small and one logical change each:
  `feat(booking): add server-side availability re-check (#7)`
- **Pull request:** body has `Closes #<issue>`, a short summary and the acceptance-criteria checklist. `npm run lint`, `npm run test` and `npm run build` pass before opening. At least **one teammate review** before merge — AI-generated code is reviewed like any other code.
- **Issues in code:** only for temporary workarounds, always with a number: `// TODO(#12): replace polling with Realtime`.

---

## 4. Do's and don'ts

<!-- Hard rules. Security and accessibility come from PRD §8. -->

### Do
- Validate **all** input on the server with Zod schemas from `lib/validation/`, even if the form validates too.
- Use the Supabase server client in Server Components/Actions, the browser client only in client components.
- Generate guest tokens (`manage_token`, `status_token`) with `crypto.randomUUID()` or 32+ random bytes; pages without a valid token show an error and no data.
- Keep RLS on every table: a restaurant reads and writes only its own rows.
- Accessibility (WCAG 2.1 AA): a `<label>` on every input, errors linked via `aria-describedby`, keyboard navigation with visible focus, sufficient contrast, status shown with text not just color, `aria-live="polite"` for status changes, `alt` text on images.
- Show friendly error messages to users; log technical details on the server only.

### Don't
- Don't add, remove or upgrade dependencies without asking.
- Don't create summary, guide or checklist Markdown files (e.g. `IMPLEMENTATION_SUMMARY.md`) unless asked — report in the chat.
- Don't change config or shared files (`next.config.ts`, `eslint.config.mjs`, `README.md`, `app/layout.tsx`) unless the issue needs it; if it does, say why in the plan.
- Don't put secrets in code or git: keys live in `.env.local`; `.env.example` lists names only. The Supabase **service role key never reaches client code**.
- Don't bypass RLS or rely on browser-only checks for a rule (e.g. double booking).
- Don't expose guest phone or email to anyone except the restaurant they booked with.
- Don't build out-of-scope features (PRD §12): guest accounts, SMS, payments, reviews, floor plans, staff roles — and not the **Menu** section from the G2 mockup (not in the PRD).
- Don't use `any`, `@ts-ignore` or `eslint-disable` to silence errors.

### Libraries
- **Approved to add when needed (mention in the PR):** `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`, `@vitejs/plugin-react`, `eslint-config-prettier`, `server-only`.
- **Avoid:** UI kits (MUI, Chakra, Bootstrap), CSS-in-JS, ORMs (Prisma, Drizzle), `axios` (use `fetch`), `moment` (use `Date`/`Intl`), Redux/Zustand, form libraries.
