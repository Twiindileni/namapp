-- Driving School: Active session timer
-- Run in Supabase SQL Editor. One row per booking when admin has pressed "Start"; removed when "Finish" is pressed.
-- Finish creates a driving_school_sessions row with calculated hours and removes this row.

create table if not exists public.driving_school_active_sessions (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references public.driving_school_bookings(id) on delete cascade,
  started_at timestamptz not null default now()
);

create unique index if not exists driving_school_active_sessions_booking_id on public.driving_school_active_sessions(booking_id);

alter table public.driving_school_active_sessions enable row level security;

-- Admin only
drop policy if exists driving_school_active_sessions_admin on public.driving_school_active_sessions;
create policy driving_school_active_sessions_admin on public.driving_school_active_sessions
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
