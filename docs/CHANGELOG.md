# TableNook Change Log

All significant changes to architecture, rules, documentation, and features. Listed newest first.

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
