-- Allow a confirmed table deletion to leave future reservation records intact.
-- The table_id becomes null, preserving guest and booking details for the owner.

alter table public.reservations
  drop constraint reservations_table_id_fkey;

alter table public.reservations
  alter column table_id drop not null;

alter table public.reservations
  add constraint reservations_table_id_fkey
  foreign key (table_id)
  references public.tables (id)
  on delete set null;
