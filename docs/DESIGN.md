# TableNook — Design Guide

<!-- Describes the mockups in text so AI agents can implement UI without reading images.
     Images: docs/mockups/. Requirements: docs/PRD.md. Linked from AGENTS.md. -->

## 1. Visual style

- **Feel:** calm, local, editorial. Lots of white space, few colors, big confident headings.
- **Colors** (approximate, define once as Tailwind theme tokens in `app/globals.css`):
  - Background: warm off-white `#F8F8F5`; surfaces/cards: white
  - Primary: dark green `#1F4A40` (buttons, active tabs, logo)
  - Accent: mustard `#F2C14E` with dark text (availability badges, "Seated", "Table confirmed")
  - Text: near-black `#1A1F1C`; secondary text: gray `#5F6662`; borders: light gray `#E3E3DE`
- **Type:** one geometric sans-serif. Headings bold with tight letter-spacing; H1 very large on landing/search pages. Labels bold, small.
- **Shape:** rounded corners (inputs/buttons ~8px, cards ~12px), 1px light borders, no heavy shadows.
- **Layout:** content centered, max width ~1100px; forms (auth) narrow, ~540px. Desktop-first, stacks to one column on phones.

## 2. Shared components

| Component | Look and behavior |
|---|---|
| `SiteHeader` | White bar, bottom border. Logo icon + "TableNook" (left). Restaurant area adds "\| Restaurant" label and a "Guest site" link on the right. |
| `Button` | `primary`: green fill, white bold text. `secondary`: white with green border. Disabled while submitting. |
| `Field` | Bold label above; white input or select with light border. Error text below in red, linked with `aria-describedby`. |
| `Badge` | Mustard pill with bold dark text, e.g. "Table free at 7:00 PM". |
| `Tabs` | Text tabs, active one bold with a green underline. A disabled tab shows a small "Soon" pill. |
| `PillToggle` | Rounded pills with counts, e.g. "Today (7)" / "Upcoming (3)"; active pill tinted green. |
| `TimeSlotButton` | White bordered tile: time (bold) + "Free". Booked: gray fill, time struck through, "Booked", disabled. |
| `StatusSelect` | Pill-shaped dropdown per reservation status (see R3). |
| `EmptyState` | Short message + one suggestion, centered in the list area. |

Status is never shown by color alone — always with a text label.

## 3. Screens with mockups

### H0 Start — `/` · `h0-start.png`
- Hero: H1 "Your favorite local table, no phone call needed." + one paragraph about TableNook.
- Right side: sample booking card (dashed border, slightly tilted): restaurant, neighborhood, time, party, "Table confirmed" badge. Decorative only.
- "How will you use TableNook?" — two cards side by side:
  - **I'm looking for a table:** 3 bullets + primary button "Find a table" → G1.
  - **I run a restaurant:** 3 bullets + secondary button "Set up or log in" → R1.

### G1 Search — `/search` · `g1-search.png`
- H1 "Find a table in Maple Bay" + subtitle.
- Filter card with one row: Neighborhood (default "All neighborhoods"), Date, Time (30-min steps), Party size ("2 people") + primary button "Show restaurants".
- Summary line: "3 restaurants with a free table. Availability for Fri, Nov 6 at 7:00 PM, party of 2."
- Results as rows separated by dividers: name (bold), "Cuisine in Neighborhood" (gray), one-line description; `Badge` "Table free at {time}" on the right. Whole row links to G2.
- Empty state: "No tables match. Try another time or neighborhood."

### G2 Restaurant — `/restaurants/[id]` · `g2-restaurant.png`
- H1 name, "Cuisine in Neighborhood", description.
- Info row (3 columns): Address · Hours today · Largest table.
- "Pick a time": Date + Party size, then a grid of `TimeSlotButton`s (5 per row on desktop). Clicking a free slot opens G3.
- Helper text under the grid explains the slot rules (30-min slots, 90-min hold).
- Closed day: no grid, message "Closed on this day".
- **Menu section is in the mockup but NOT in the PRD data model — do not implement unless the PRD is updated.**
- Waitlist box ("X parties waiting, ~Y min" + "Join waitlist") is added here in Sprint 2.

### R1 Auth — `/login`, `/signup` · `r1-auth.png`
- Restaurant `SiteHeader`. Narrow centered column.
- H1 "TableNook for restaurants" + "Take bookings online for free. Set up takes about 10 minutes."
- `Tabs`: Log in / Sign up. Fields: Email, Password; full-width primary button.
- Wrong credentials: error message above the button, user stays on the page. Sign up: password min 8 chars, inline error.

### R3 Dashboard — Reservations — `/dashboard` · `r3-reservations.png`
- H1 restaurant name; date below ("Friday, November 6"); right side summary "**6 reservations**, 19 guests expected" (excludes cancelled).
- `Tabs`: Reservations | Waitlist (disabled + "Soon" in Sprint 1).
- `PillToggle`: Today (n) / Upcoming (n) — counts include all statuses.
- White table card, columns: Time (bold) · Guest · Party · Table · Status. Sorted by time.
- `StatusSelect` styles: **Confirmed** = white, green border · **Seated** = mustard fill · **No-show** = dashed gray border, gray text · **Cancelled** = dashed gray border and the whole row gray and struck through.
- New bookings appear live; empty state "No reservations today".

## 4. Screens without mockups (follow the same patterns)

- **G3 Booking form** — `/restaurants/[id]/book`: summary of restaurant, date, time, party at top; fields Name, Phone, Email; primary "Book table". Slot taken → banner "This time is no longer available" + up to 3 alternative `TimeSlotButton`s.
- **G4 Confirmation** — `/bookings/[token]/confirmed`: card like the H0 sample card with "Table confirmed" badge + "We sent the details to {email}".
- **G5 Join waitlist / G6 Waitlist status** (Sprint 2): form like G3; status page with large position number, estimate, status; "Your table is ready" in a mustard banner announced via `aria-live`; secondary "Leave waitlist".
- **G7 Manage booking** — `/bookings/[token]`: booking card + secondary "Cancel booking" with confirm step. Invalid token → error message, no details.
- **R2 Setup** — `/setup`: three sections on one page: Profile, Opening hours (7 rows: day, open, close, "Closed" checkbox), Tables (list with label + capacity, add/edit/delete).
- **R4 Waitlist** (Sprint 2): same table style as R3; columns Position · Guest · Party · Waiting; actions Call / Seated / Remove.
