# TableNook — Product Requirements Document (PRD)

**Course:** AI Coding — P2 Project
**Team:** Partner A, Partner B
**Status:** Draft v1.1 (see §15 Revision history)
**Location in repo:** `docs/PRD.md`

---

## 1. Overview

TableNook is a web application that gives small, independent restaurants a simple, free way to accept online reservations and run a digital waitlist, and gives guests one place to discover these restaurants, check availability, book a table, or join a waitlist without calling or walking in.

The MVP has two user roles:

- **Guest** — browses restaurants, books a table, or joins a waitlist. No account needed; the guest provides a name, phone number, and email.
- **Restaurant** — owner or staff member with an account who sets up the restaurant profile, hours, and tables, and manages reservations and the waitlist.

All restaurant data in the MVP is demo data for a fictional city, **Maple Bay**.

---

## 2. Problem Statement

Guests cannot always book a table online. Depending on the restaurant, they may need to call and wait for staff to answer, visit in person to make a reservation or find out how long the wait is, or navigate the restaurant's own website to find a booking system.

Large platforms such as OpenTable, Resy, Yelp Guest Manager, and Reserve with Google already let guests book many restaurants in one place. However, small independent restaurants and bars are often not on these platforms, partly because of their cost (for example, per-cover fees) and setup effort. As a result, these restaurants stay "offline": guests have to call or walk in, last-minute diners can't see availability, and the restaurants lose bookings.

Waitlists are a particular pain point. Some small restaurants still keep their waitlist on paper at the host stand. To get on it, guests must come to the restaurant in person and add their name. Because there is no way to be notified remotely, guests often have to stay at or near the entrance, sometimes for a long time, so they don't miss their turn when staff call their name. This wastes guests' time, crowds the entrance, and gives the restaurant no easy way to tell guests how long the wait really is.

**Core problem:** Small independent restaurants lack an affordable, simple tool for online bookings and waitlists, so guests can't easily discover their availability, book a table, or join a line remotely, and instead have to sign up on a paper list in person and wait on site so they don't miss their turn.

> **Research gap:** We have not established with reliable national data how many U.S. restaurants lack online booking, or how often guests encounter these barriers. We will not claim the problem is widespread without evidence. Customer and restaurant interviews are needed to validate it.

---

## 3. Competitors & Differentiation

| Product | What it does | Gap TableNook addresses |
|---|---|---|
| OpenTable | Large reservation marketplace | Per-cover network fees can be costly for small venues |
| Resy | Reservations for upscale venues | Focused on higher-end restaurants |
| Yelp Guest Manager | Reservations + waitlist tied to Yelp | Paid product built around Yelp's ecosystem |
| Reserve with Google | Booking from Google Search/Maps via partners | Requires the restaurant to already use a booking partner |

**TableNook's differentiation:** free and minimal setup aimed specifically at small independent restaurants, combining reservations and a digital waitlist in one simple dashboard, with no guest account required.

---

## 4. Goals & Success Metrics

| Goal | Success metric (measured in the demo/tests) |
|---|---|
| Guests can book quickly | A guest completes a booking in under 2 minutes and within 4 screens, counted from the Search page (G1) |
| Restaurants can onboard easily | A new restaurant completes setup (profile, hours, tables) in under 10 minutes |
| Bookings are reliable | 0 double bookings of the same table in automated tests |
| The waitlist feels live | A guest's waitlist status updates within 5 seconds of a staff action, without a page reload |
| Guests stay informed | Confirmation and "your table is ready" emails are sent for 100% of bookings and called waitlist entries in the demo |
| Code quality | ≥70% test coverage on booking and waitlist business logic |

---

## 5. Target Users / Personas

**Maya, 29 — Guest (last-minute diner)**
Lives in Maple Bay and often decides where to eat an hour before dinner. Prefers small local places but hates calling to ask about availability.
*Main need:* see which local restaurants have a table now, or how long the wait is, and secure a spot from her phone or laptop.

**Daniel, 45 — Guest (planner)**
Books dinners for family occasions a few days ahead.
*Main need:* book a table for a specific date, time, and party size, and get a confirmation he can rely on.

**Rosa, 52 — Restaurant owner**
Runs a 12-table family restaurant. Takes reservations by phone and keeps a paper waitlist on busy nights. Finds big platforms too expensive.
*Main need:* a free, simple way to accept online bookings and manage the walk-in line without extra staff.

---

## 6. User Stories & Acceptance Criteria

Priority: **High** = Sprint 1, **Medium** = Sprint 2.

### Sprint 1 — Core booking (Oct 28 – Nov 6)

#### US-1: Restaurant account sign-up and login — High
As a **restaurant owner**, I want to create an account and log in, so that only I can manage my restaurant's bookings.

- [ ] Given I'm on the sign-up page, when I enter a valid email and a password of at least 8 characters, then my account is created and I'm taken to restaurant setup
- [ ] Given I have an account, when I log in with correct credentials, then I see my dashboard
- [ ] Given I enter wrong credentials, when I submit, then I see an error message and stay on the login page
- [ ] Given I'm logged in, when I click "Log out", then I'm signed out and dashboard pages redirect to login

#### US-2: Restaurant profile and opening hours — High
As a **restaurant owner**, I want to set up my restaurant's profile and opening hours, so that guests can find me and book only when I'm open.

- [ ] Given I'm in setup, when I enter name, neighborhood, cuisine, address, and a short description and save, then my restaurant appears in the guest search
- [ ] Given I'm in setup, when I set opening and closing times for each day (or mark a day closed), then guests can only pick times within those hours
- [ ] Given a required field is empty, when I save, then I see which field is missing and nothing is saved

#### US-3: Table configuration — High
As a **restaurant owner**, I want to add my tables and their seat counts, so that the system knows what party sizes I can seat.

- [ ] Given I'm in setup, when I add a table with a label and a capacity (1–20 seats), then it appears in my table list
- [ ] Given a table exists, when I edit or delete it, then the change is saved and reflected in availability
- [ ] Given a table has future reservations, when I try to delete it, then I see a warning and must confirm

#### US-4: Search and filter restaurants — High
As a **guest**, I want to search restaurants by neighborhood, date, time, and party size, so that I only see places that can actually seat me.

- [ ] Given I'm on the home page, when I see the restaurant list, then each card shows name, neighborhood, cuisine, and whether it has availability for my selected time
- [ ] Given I choose a neighborhood, date, time, and party size, when I apply filters, then only restaurants that are open and have a suitable free table are shown
- [ ] Given no restaurants match, when results load, then I see an empty-state message suggesting other times or neighborhoods

#### US-5: Book a table — High
As a **guest**, I want to book a table by entering my name, phone, and email, so that I have a confirmed reservation without creating an account.

- [ ] Given I select a restaurant, date, time slot, and party size, when I enter a name, a valid phone number, and a valid email and submit, then the reservation is created and I see a confirmation screen
- [ ] Given my booking is created, when it is saved, then I receive a confirmation email with the details and a link to manage my booking
- [ ] Given another guest booked the last suitable table while I was filling out the form, when I submit, then I see a message that the slot is no longer available and alternative times are suggested
- [ ] Given an invalid phone or email, when I submit, then I see an inline error and the booking is not created

#### US-6: Manage reservations (restaurant) — High
As a **restaurant owner**, I want to see and manage today's and upcoming reservations, so that I can prepare and seat guests.

- [ ] Given I'm logged in, when I open the dashboard, then I see today's reservations sorted by time with guest name, party size, table, and status
- [ ] Given a reservation, when I change its status (Confirmed → Seated, No-show, or Cancelled), then the status updates immediately
- [ ] Given a new guest booking is created, when I'm viewing the dashboard, then it appears without a page reload
- [ ] Given I'm logged in, when I view reservations, then I only see my own restaurant's data

### Sprint 2 — Waitlist and self-service (Nov 6 – Nov 12)

#### US-7: Join the waitlist — Medium
As a **guest**, I want to join a restaurant's waitlist remotely and see the estimated wait, so that I don't have to stand in line.

- [ ] Given a restaurant is open now, when I view it, then I see the current number of parties waiting and an estimated wait time
- [ ] Given I enter my name, phone, email, and party size, when I join, then I'm added to the end of the waitlist and see my position
- [ ] Given I joined, when the entry is saved, then I receive an email with a link to my waitlist status page
- [ ] Given the restaurant is closed, when I view it, then the "Join waitlist" button is disabled with an explanation

#### US-8: Manage the waitlist (restaurant) — Medium
As a **restaurant owner**, I want to manage my waitlist, so that I can call, seat, or remove parties in order.

- [ ] Given parties are waiting, when I open the waitlist tab, then I see them in order with name, party size, and time waiting
- [ ] Given a party, when I click "Call", then their status changes to Called and they receive a "your table is ready" email
- [ ] Given a called party, when I click "Seated" or "Remove", then they leave the active waitlist and positions update for everyone else

#### US-9: Live waitlist status — Medium
As a **guest**, I want my waitlist status page to update live, so that I know when to head to the restaurant.

- [ ] Given I open my status link, when the page loads, then I see my position, the estimated wait, and my status
- [ ] Given the restaurant calls or removes a party ahead of me, when it happens, then my position and estimate update within 5 seconds without a reload
- [ ] Given my status changes to Called, when the page updates, then I see a clear "Your table is ready" message
- [ ] Given I want to leave the line, when I click "Leave waitlist", then I'm removed and see a confirmation

#### US-10: Cancel a reservation (guest) — Medium
As a **guest**, I want to cancel my reservation from the link in my email, so that the table is freed for others.

- [ ] Given I open the manage link from my confirmation email, when the page loads, then I see my reservation details
- [ ] Given the reservation is in the future, when I click "Cancel" and confirm, then it's cancelled and the time slot becomes available again
- [ ] Given an invalid or expired link, when I open it, then I see an error message and no reservation details

---

## 7. Functional Requirements

| ID | Feature | Behavior | Story |
|---|---|---|---|
| FR-1 | Restaurant auth | Email + password sign-up and login via Supabase Auth; session persists until logout | US-1 |
| FR-2 | Restaurant profile | Name, neighborhood, cuisine, address, description; required-field validation | US-2 |
| FR-3 | Opening hours | Open/close time per weekday or "closed"; bookable slots generated only within hours | US-2 |
| FR-4 | Tables | Label + capacity (1–20); create, edit, delete with warning if future bookings exist | US-3 |
| FR-5 | Restaurant search | Filter by neighborhood, date, time, party size; show availability per restaurant | US-4 |
| FR-6 | Availability rules | 30-minute time slots; each reservation holds a table for 90 minutes; a slot is available if at least one table with capacity ≥ party size has no overlapping reservation | US-4, US-5 |
| FR-7 | Booking | Guest enters name, phone, email; server re-checks availability before saving to prevent double booking | US-5 |
| FR-8 | Confirmation email | Sent via Resend after booking, with details and a manage link containing a secure token | US-5 |
| FR-9 | Reservation dashboard | Today and upcoming lists; status changes (Confirmed, Seated, No-show, Cancelled); live updates | US-6 |
| FR-10 | Waitlist join | Guest joins with name, phone, email, party size; position and estimate shown | US-7 |
| FR-11 | Wait estimate | Estimate = (parties ahead ÷ number of tables that fit the party) × average turn time; average turn time set by the restaurant, default 45 minutes | US-7, US-9 |
| FR-12 | Waitlist management | Call (sends email), Seated, Remove; positions recalculate | US-8 |
| FR-13 | Live status page | Token-based guest page with live position, estimate, status, and "Leave waitlist" | US-9 |
| FR-14 | Guest cancellation | Token-based manage page; cancelling frees the slot | US-10 |

---

## 8. Non-Functional Requirements

**Security & privacy**
- Supabase Row Level Security (RLS) on all tables: a restaurant can only read and modify its own data.
- Guest manage and status pages use long, random, unguessable tokens; no guest data is exposed without a token.
- Guest phone numbers and emails are visible only to the restaurant they booked with.
- All input is validated on the server (Zod schemas), not only in the browser.
- No secrets (API keys, service keys) in client code or in the repository; use environment variables.

**Accessibility**
- Target WCAG 2.1 AA: sufficient color contrast, labels on every form input, visible focus states, full keyboard navigation, alt text for images.
- Status changes (booking confirmed, waitlist called) are announced to screen readers.

**Performance**
- Pages load in under 2 seconds on a typical connection.
- Waitlist and dashboard updates appear within 5 seconds.

**Compatibility**
- Desktop-first web app that remains usable on tablet and phone screens (responsive layout).
- Latest versions of Chrome, Firefox, Safari, and Edge.

---

## 9. Tech Stack & Constraints

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Framework | Next.js (App Router) with React |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (restaurant accounts only) |
| Real-time | Supabase Realtime (dashboard and waitlist status) |
| Email | Resend |
| Validation | Zod |
| Unit tests | Vitest |
| End-to-end tests | Playwright |
| Hosting | Vercel |
| Code quality | ESLint + Prettier |

**Constraints**
- Use the latest stable versions at project start and pin exact versions in `package.json`; record them in AGENTS.md.
- Free tiers only (Supabase, Resend, Vercel).
- No integrations with OpenTable, Resy, Google, or Yelp; all restaurants are demo data seeded into the database.
- Two sprints, about 2 weeks total; scope is limited to the stories above.

### Data model (draft)

| Table | Key fields |
|---|---|
| `restaurants` | id, owner_id, name, neighborhood, cuisine, address, description, avg_turn_minutes |
| `opening_hours` | id, restaurant_id, weekday, open_time, close_time, is_closed |
| `tables` | id, restaurant_id, label, capacity |
| `reservations` | id, restaurant_id, table_id, guest_name, guest_phone, guest_email, party_size, starts_at, ends_at, status, manage_token |
| `waitlist_entries` | id, restaurant_id, guest_name, guest_phone, guest_email, party_size, joined_at, status, status_token |

### Demo data
Fictional city **Maple Bay** with four neighborhoods: **Old Harbor, Riverside, Midtown, Hillcrest**. Seed at least 8 restaurants with varied cuisines, hours, and table layouts.

---

## 10. User Flows

### Flow 1: Guest books a table
1. Guest opens the Start page and clicks "Find a table" (or opens the Search page directly).
2. On the Search page, selects neighborhood, date, time, and party size, then clicks "Show restaurants".
3. Clicks a restaurant card and sees the Restaurant page with available time slots.
4. Clicks a time slot and the Booking form opens.
5. Enters name, phone, and email and clicks "Book table".
   - If a field is invalid: an inline error is shown.
   - If the slot was just taken: a message appears with alternative times.
6. Sees the Confirmation screen and receives a confirmation email.

### Flow 2: Guest joins the waitlist
1. Guest opens a Restaurant page while it's open and sees "X parties waiting, ~Y min".
2. Clicks "Join waitlist", enters name, phone, email, and party size.
3. Sees their position and estimate, and receives an email with a status link.
4. The Waitlist status page updates live as parties ahead are seated.
5. When the restaurant clicks "Call", the page shows "Your table is ready" and an email is sent.
6. (Optional) Guest clicks "Leave waitlist" to cancel.

### Flow 3: Restaurant onboarding
1. Owner opens Sign up, enters email and password.
2. Fills in the restaurant profile (name, neighborhood, cuisine, address, description).
3. Sets opening hours for each weekday.
4. Adds tables with labels and capacities.
5. Lands on the Dashboard; the restaurant is now visible to guests.

### Flow 4: Restaurant runs service
1. Owner logs in and opens the Dashboard ("Today" view).
2. Sees today's reservations by time and marks guests Seated or No-show as they arrive.
3. New guest bookings appear live.
4. Switches to the Waitlist tab, clicks "Call" for the next party, then "Seated" when they arrive.

### Flow 5: Guest cancels a reservation
1. Guest opens the manage link from the confirmation email.
2. Sees the reservation details and clicks "Cancel", then confirms.
3. Sees a cancellation confirmation; the slot becomes available again.

---

## 11. Mockups

The visual design is described in text in **`docs/DESIGN.md`** (colors, typography, shared components, and every screen with its states). Mockup images are in `docs/mockups/`; screens without an image are described in DESIGN.md only and follow the same patterns.

**Guest screens**
| # | Screen | Purpose | Mockup image |
|---|---|---|---|
| H0 | Start | Landing page: what TableNook is, choice between guest and restaurant | `docs/mockups/h0-start.png` |
| G1 | Search | Restaurant list with filters and availability badges | `docs/mockups/g1-search.png` |
| G2 | Restaurant page | Details, hours, available time slots (waitlist info in Sprint 2) | `docs/mockups/g2-restaurant.png` |
| G3 | Booking form | Name, phone, email, party size | text only |
| G4 | Booking confirmation | Booking details and next steps | text only |
| G5 | Join waitlist form | Name, phone, email, party size | text only |
| G6 | Waitlist status | Live position, estimate, "Leave waitlist" | text only |
| G7 | Manage booking | Reservation details and "Cancel" | text only |

**Restaurant screens**
| # | Screen | Purpose | Mockup image |
|---|---|---|---|
| R1 | Log in / Sign up | Restaurant account access | `docs/mockups/r1-auth.png` |
| R2 | Setup | Profile, opening hours, tables | text only |
| R3 | Dashboard — Reservations | Today's and upcoming bookings with status controls | `docs/mockups/r3-reservations.png` |
| R4 | Dashboard — Waitlist | Ordered waitlist with Call / Seated / Remove | text only |

Each screen also has an **empty state** (e.g., "No reservations today") and an **error state** where relevant. The Menu section shown in the G2 mockup is illustrative only (see §12).

---

## 12. Out of Scope (not in P2)

- Integrations with OpenTable, Resy, Reserve with Google, Yelp, or POS systems
- Guest accounts, profiles, or booking history
- SMS notifications (email only)
- Payments, deposits, or no-show fees
- Reviews, ratings, and photos uploaded by guests
- Native mobile apps (iOS/Android)
- Visual floor plans and automatic table assignment optimization
- Multiple staff accounts or roles per restaurant
- Planning a night out across multiple restaurants
- Real restaurant data (demo data for Maple Bay only)
- Restaurant menus (shown in the G2 mockup for illustration only; not in the data model)

---

## 13. Timeline

| Sprint | Dates | Scope |
|---|---|---|
| Sprint 1 | Oct 28 – Nov 6 | US-1 to US-6: restaurant auth and setup, search, booking, confirmation email, reservation dashboard |
| Sprint 2 | Nov 6 – Nov 12 | US-7 to US-10: waitlist (join, manage, live status), guest cancellation |

Sprint 2 is shorter (about 6 days), so it holds the four medium-priority stories. If time runs short, US-10 (guest cancellation) is the first candidate to move out.

---

## 14. Risks & Open Questions

| Risk / question | Mitigation |
|---|---|
| The problem's scale is unverified (see Research gap) | Conduct a few guest and restaurant interviews; frame claims carefully |
| Short Sprint 2 | Keep Sprint 2 stories small; US-10 is the cut candidate |
| Double booking under concurrent requests | Re-check availability on the server inside a database transaction or constraint before saving |
| Email delivery limits on free tiers | Test with team members' own addresses; check Resend's free-tier sending rules early in Sprint 1 |
| Wait estimate accuracy | Keep the formula simple and transparent; let restaurants adjust average turn time |
| **Open question:** what is the last bookable slot before closing? (The G2 mockup shows 9:00 PM for a 10:00 PM closing.) | Decide before implementing slot generation (US-2, US-4); then update FR-3/FR-6, AGENTS.md §1.3 and the G2 helper text |

---

## 15. Revision history

| Version | Changes |
|---|---|
| v1 | Initial PRD: problem, personas, user stories US-1…US-10, requirements, flows, timeline |
| v1.1 | Added Start page (H0) and renamed Home to Search (G1); updated Flow 1; booking metric counted from G1; §11 filled with mockups and link to `docs/DESIGN.md`; menus added to Out of Scope; open question on the last bookable slot |
