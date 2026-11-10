# Restaurant search

The guest search at `/search` filters by neighborhood, date, time and party size.
Times are interpreted in Maple Bay's `America/Los_Angeles` time zone. A search
returns restaurants open at the selected time that have a table large enough
with no overlapping confirmed or seated reservation during the 90-minute hold.
Cancelled and no-show reservations do not block availability.

Searches use 30-minute start times. Times skipped or repeated during a daylight
saving transition cannot be selected unambiguously and are rejected. The PRD
leaves the last bookable slot before closing undecided: the current search
requires the start time to be before closing, but does not require the full
90-minute hold to finish before closing. Booking is not implemented here;
availability must be checked again when a booking is created.

`npm test` runs the unit tests. `npm run test:e2e` runs the browser tests,
including a search that requires the seeded Maple Bay restaurants and a
configured Supabase project.
