-- Add date and time selection for driving school bookings
-- Run in Supabase SQL Editor after driving-school-migration.sql

alter table public.driving_school_bookings
  add column if not exists preferred_date date,
  add column if not exists preferred_time text;

comment on column public.driving_school_bookings.preferred_date is 'Selected lesson date (calendar)';
comment on column public.driving_school_bookings.preferred_time is 'Selected lesson time (e.g. 09:00 or 14:30)';
