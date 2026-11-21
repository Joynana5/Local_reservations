# Sprint 2 — Restaurant side and waitlist

**Dates:** 10 Nov – 15 Nov
**Product Owner and Scrum Master:** usseiint

## Sprint Planning
**Sprint goal:** A restaurant owner can sign up, set up the restaurant and tables,
and manage bookings live; a guest can join a waitlist and see their status;
a guest can cancel a booking.

| Issue | Title | Owner | Size | Result |
|---|---|---|---|---|
| #13 | Guest cancellation via manage link (US-10) | usseiint | M | |
| #3 | Restaurant sign-up, login, logout (US-1) | usseiint | M | |
| #? | Profile and opening hours (US-2) | usseiint | M | |
| #? | Table configuration (US-3) | usseiint | M | |
| #? | Reservation dashboard with live updates (US-6) | usseiint | L | |
| #10 | Join waitlist (US-7) | usseiint | M | |
| #11 | Manage waitlist (US-8) | usseiint | M | |
| #12 | Live waitlist status (US-9) | usseiint | M | |
| #28 | Fix e2e naming rule in AGENTS.md | usseiint | S | |

**Scope plan:** the PRD named US-10 as the first cut candidate, but US-10 was
already done (#13), so the cut order became US-9, then US-8, then US-7.
Live updates may use 5-second polling instead of Realtime (PRD: updates within 5 s).

## Standups
**📅 Nov 11**
- ✅ Done: confirmation email via Resend (#8, PR #27); committed the Next.js agent
  rules block to stop `next dev` rewriting AGENTS.md (#24, PR #25); opened PR #26
  (Tabs, header variants, guest/restaurant layouts, H0 start page, #18);
  implemented guest cancellation locally (#13).
- 🎯 Next: open the PR for #13, start restaurant auth (#3).
- 🚧 Blockers: #8 turned out to be implemented twice (the issue had no assignee);
  kept the working version. Accidentally deleted the reservations table while
  cleaning test data and restored it from the migration file. PRs are waiting
  for partner review.

**📅 Nov 15**
- ✅ Done: restaurant sign-up, login and logout (#3, PR #29), including fixes from
  the AI self-review (logout errors, byte-based password limit); guest cancellation
  merged (#13, PR #30); Sprint 1 docs updated.
- 🎯 Next: restaurant setup (#4, #5), reservation dashboard (#9), deploy to Vercel.
- 🚧 Blockers: my partner stopped contributing, so I took over all remaining issues.
  The #3 branch was created from an outdated main and had to be merged with PR #26.
  Copilot credits are almost used up.

**📅 Nov 15**
- ✅ Done: restaurant profile, opening hours and tables (#4, #5, PR #31);
  reservation dashboard with live updates (#9, PR #32); deployed to Vercel;
  sprint docs and README.
- 🎯 Next: submit P2.
- 🚧 Blockers: waitlist stories (#10–#12) cut for time and moved to the backlog.

## Sprint Review
My partner stopped contributing and I took over all remaining
issues. Lesson for future teams: assign an owner to every issue at sprint planning
and check progress at every standup, so a gap is visible early.

## Retrospective
- Added a CI/CD pipeline (lint, typecheck, unit + integration tests, build, E2E,
  npm audit, CodeQL, Dependabot); it caught a missing env var on its first run (#34).
- Applied the Next.js 16.4.6 security update through a regular PR, because
  Dependabot PRs cannot read repository secrets (#45).
- Built the public REST API test-first: failing integration tests were committed
  before the route handlers, and the agent followed the same pattern for POST/DELETE (#44).
