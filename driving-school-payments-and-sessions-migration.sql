-- Driving School: Payments & Practice Sessions
-- Run in Supabase SQL Editor. Enables tracking: total paid, hours purchased (N$130/hr), hours practiced, remaining, completion %.
-- Admin records payment amounts and practice sessions; student dashboard shows totals and timeline.

-- Payments: each payment recorded by admin (amount in NAD)
create table if not exists public.driving_school_payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.driving_school_bookings(id) on delete cascade,
  amount_nad numeric(12,2) not null check (amount_nad > 0),
  note text,
  created_at timestamptz default now()
);

create index if not exists driving_school_payments_booking_id on public.driving_school_payments(booking_id);

-- Practice sessions: each session has hours practiced (admin records)
create table if not exists public.driving_school_sessions (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.driving_school_bookings(id) on delete cascade,
  hours numeric(5,2) not null check (hours > 0),
  session_date date,
  note text,
  created_at timestamptz default now()
);

create index if not exists driving_school_sessions_booking_id on public.driving_school_sessions(booking_id);

-- RLS: same as bookings – admin full; learners can read their own via booking
alter table public.driving_school_payments enable row level security;
alter table public.driving_school_sessions enable row level security;

-- Admin can do everything on payments/sessions
drop policy if exists driving_school_payments_admin on public.driving_school_payments;
create policy driving_school_payments_admin on public.driving_school_payments
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

drop policy if exists driving_school_sessions_admin on public.driving_school_sessions;
create policy driving_school_sessions_admin on public.driving_school_sessions
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Learners can read payments/sessions for their own bookings
drop policy if exists driving_school_payments_select_own on public.driving_school_payments;
create policy driving_school_payments_select_own on public.driving_school_payments
  for select to authenticated using (
    exists (select 1 from public.driving_school_bookings b where b.id = booking_id and b.user_id = auth.uid())
  );

drop policy if exists driving_school_sessions_select_own on public.driving_school_sessions;
create policy driving_school_sessions_select_own on public.driving_school_sessions
  for select to authenticated using (
    exists (select 1 from public.driving_school_bookings b where b.id = booking_id and b.user_id = auth.uid())
  );
