# TableNook Change Log

All significant changes to architecture, rules, documentation, and features. Listed newest first.

---

## 2026-11-15 — Guest Cancellation via Manage Link (US-10, #13)

**What:** Added the manage page `/bookings/[token]` (G7) showing the reservation with a "Cancel booking" button and an inline confirm step. Cancelling sets `status = 'cancelled'` with a single conditional update (`confirmed` and `starts_at > now`), so the partial `no_double_booking` constraint and availability queries free the slot. Unknown or malformed tokens show an error and no reservation data.

**Why:** FR-14 — guests can free their table from the link in the confirmation email (#8). The conditional update avoids overwriting a concurrent status change by the restaurant.

**Files:** `app/(guest)/bookings/[token]/page.tsx`, `components/guest/cancel-booking-form.tsx`, `lib/actions/cancel-reservation-action.ts`, `lib/booking/cancel-reservation.ts`, `lib/validation/cancel.ts`, `lib/supabase/admin.ts`, `e2e/manage-booking.e2e.ts`

---

## 2026-11-10 — Supabase Client Architecture Split

**What:** Created three separate clients (`lib/supabase/admin.ts`, `server.ts`, `client.ts`) replacing monolithic `lib/supabase.ts`. Updated imports in `app/actions.ts` and `app/actions.test.ts`. Added usage rule to `AGENTS.md` §1.2.

**Rule added to AGENTS.md:**
```
Guest flows use admin client; owner flows must use server client (RLS). 
Never use admin client for owner data.
```

**Why:** Prevents accidentally using secret key in restaurant-owner features, which would bypass Row Level Security and leak data between restaurants.

**Files:** `lib/supabase/admin.ts` (created), `lib/supabase/server.ts` (created), `lib/supabase/client.ts` (created), `lib/supabase.ts` (deleted), `app/actions.ts`, `app/actions.test.ts`, `AGENTS.md` §1.2

---

## 2026-11-10 — Restaurant Search End-Time Validation Fix

**What:** Fixed `app/actions.ts` search to validate that 90-min booking ends by closing time (not just starts within hours).

**Why:** FR-7 domain rule: last available slot = closing time − 90 min. Example: closes 9:00 PM → last slot 7:30 PM. Previous code only checked start time, excluding restaurants incorrectly.

**Files:** `app/actions.ts` (lines ~40–50)

---

## How to Add Entries

1. Add new dated section at top.
2. **What:** Specific file changes (concise).
3. **Why:** Business reason or domain rule (include example if needed).
4. **Files:** List affected files.
5. Reference AGENTS.md sections or GitHub issues.
