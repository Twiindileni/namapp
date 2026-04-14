-- Driving School Progress – add percentage (0–100) per stage for gradual progress
-- Run after driving-school-progress-migration.sql

-- Percentage per stage (0–100). Admin can set e.g. 30% for clutch until learner improves, then 100% to move on.
alter table public.driving_school_bookings
  add column if not exists stage_clutch_pct integer not null default 0 check (stage_clutch_pct >= 0 and stage_clutch_pct <= 100),
  add column if not exists stage_gears_pct integer not null default 0 check (stage_gears_pct >= 0 and stage_gears_pct <= 100),
  add column if not exists stage_road_driving_pct integer not null default 0 check (stage_road_driving_pct >= 0 and stage_road_driving_pct <= 100),
  add column if not exists stage_parallel_parking_pct integer not null default 0 check (stage_parallel_parking_pct >= 0 and stage_parallel_parking_pct <= 100),
  add column if not exists stage_reverse_parking_pct integer not null default 0 check (stage_reverse_parking_pct >= 0 and stage_reverse_parking_pct <= 100),
  add column if not exists stage_ready_natis_pct integer not null default 0 check (stage_ready_natis_pct >= 0 and stage_ready_natis_pct <= 100);

-- Backfill: where a stage was already marked done, set its percentage to 100
update public.driving_school_bookings set stage_clutch_pct = 100 where stage_clutch_done = true;
update public.driving_school_bookings set stage_gears_pct = 100 where stage_gears_done = true;
update public.driving_school_bookings set stage_road_driving_pct = 100 where stage_road_driving_done = true;
update public.driving_school_bookings set stage_parallel_parking_pct = 100 where stage_parallel_parking_done = true;
update public.driving_school_bookings set stage_reverse_parking_pct = 100 where stage_reverse_parking_done = true;
update public.driving_school_bookings set stage_ready_natis_pct = 100 where stage_ready_natis_done = true;
