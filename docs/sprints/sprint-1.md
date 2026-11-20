# Sprint 1 — Core guest booking

**Dates:** Nov 9 – Nov [дата закрытия Sprint 1]
**Product Owner:** usseiint · **Scrum Master:** Joynana5

## Sprint Planning
**Sprint goal:** A guest can find a restaurant, book a table without double
booking, and get a confirmation email. Shared foundation (Supabase clients,
UI components, rules files) is in place.

| Issue | Title | Owner | Size | Result |
|---|---|---|---|---|
| #1 | Project setup (Next.js, Supabase schema, seed) | usseiint | L | Done (PR #15) |
| #14 | AGENTS.md, DESIGN.md, PRD v1.1 | usseiint | M | Done (PR #16) |
| #6 | Restaurant search with availability (US-4) | usseiint | M | Done (PR #17) |
| #18 | Supabase clients, design tokens, shared UI, H0 | usseiint | M | Done (PR #22, #26) |
| #7 | Guest booking with server re-check (US-5) | usseiint | L | Done (PR #23) |
| #8 | Confirmation email via Resend (US-5) | usseiint | M | Done (PR #27) |
| #24 | Keep Next.js agent rules block in AGENTS.md | usseiint | S | Done (PR #25) |
| #3 | Restaurant sign-up / login (US-1) | Joynana5 | M | Not started → Sprint 2 |
| #? | Restaurant profile and hours (US-2) | Joynana5 | M | Not started → Sprint 2 |
| #? | Table configuration (US-3) | Joynana5 | M | Not started → Sprint 2 |
| #? | Reservation dashboard (US-6) | Joynana5 | L | Not started → Sprint 2 |

**Decisions during the sprint**
- Guest flows use the Supabase admin client on the server; restaurant flows
  must use the session client so RLS applies (rule added to AGENTS.md).
- Last bookable start time = closing time − 90 minutes.
- Phone validation: North American numbers only.

## Standups
[ссылка на Discussion или issue со standups]

<img width="1351" height="372" alt="image" src="https://github.com/user-attachments/assets/ed98aa87-40b9-4283-a723-d25893c2fd17" />

<img width="1175" height="510" alt="image" src="https://github.com/user-attachments/assets/e8893233-5b87-428c-9978-f8d116ab59d2" />

<img width="844" height="359" alt="image" src="https://github.com/user-attachments/assets/e4225ab0-fb6e-4123-91b7-af1aa3485762" />

<img width="1171" height="521" alt="image" src="https://github.com/user-attachments/assets/f33a7cd9-485e-4596-a432-0b7e0b2ebaa1" />

<img width="1342" height="403" alt="image" src="https://github.com/user-attachments/assets/848c1eb6-a872-4b11-9da2-288f621752d2" />


## Sprint Review
**Working:** search with availability → restaurant page (G2) → booking form (G3)
→ confirmation (G4) → confirmation email with a manage link.
Double booking is prevented by a server re-check plus a DB exclusion constraint;
a race for the last table is covered by unit tests.
**Not completed:** all restaurant-side stories (US-1, US-2, US-3, US-6), moved to Sprint 2.

## Retrospective
**What went well**
- AGENTS.md and DESIGN.md let us use short prompts; the agent read the issue,
  PRD and mockups itself.
- The agent found real problems: a timezone bug in availability and a mismatch
  of the closing rule between search and booking.

**What to improve**
- #8 was implemented twice because the issue had no assignee.
- Branches were created from an outdated main (feature/7, feature/3).
- The reservations table was deleted by accident while cleaning test data
  in the Supabase dashboard; restored from the migration file.
- `next dev` kept rewriting AGENTS.md until the block was committed.
- Several PRs were merged without a partner review.
- Partner stopped contributing on [дата].

**Action items**
- [ ] Set an assignee before starting any issue.
- [ ] Always `git pull` on main before creating a branch.
- [ ] Change the schema only through migration files; delete test rows with SQL.
- [ ] Post an AI self-review as a PR comment before merging.
