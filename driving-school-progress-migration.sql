-- Driving School Progress – add user_id and stage progress to bookings
-- Run in Supabase SQL Editor after driving-school-migration.sql

-- Link booking to logged-in user (nullable for guest bookings)
alter table public.driving_school_bookings
  add column if not exists user_id uuid references public.users(id) on delete set null;

-- Clutch balancing: number of times the car switched off
alter table public.driving_school_bookings
  add column if not exists clutch_switch_off_count integer not null default 0;

-- Stage completion flags (order: 1 → 2 → 3 → 4 → 5 → 6)
-- 1. Clutch balancing  2. Gears change  3. Road driving & road signs
-- 4. Parallel parking  5. Reverse parking  6. Ready for NATIS test drive
alter table public.driving_school_bookings
  add column if not exists stage_clutch_done boolean not null default false,
  add column if not exists stage_gears_done boolean not null default false,
  add column if not exists stage_road_driving_done boolean not null default false,
  add column if not exists stage_parallel_parking_done boolean not null default false,
  add column if not exists stage_reverse_parking_done boolean not null default false,
  add column if not exists stage_ready_natis_done boolean not null default false;

-- Learners can read their own bookings (where user_id = auth.uid())
drop policy if exists driving_school_bookings_select_own on public.driving_school_bookings;
create policy driving_school_bookings_select_own on public.driving_school_bookings
  for select to authenticated
  using (user_id = auth.uid());
