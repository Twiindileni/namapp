-- Driving School – Supabase migration
-- Run in Supabase SQL Editor. Rate: N$130 per hour; packages below.

-- Packages (hours, price_nad, name, description)
create table if not exists public.driving_school_packages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  hours integer not null check (hours > 0),
  price_nad numeric(12,2) not null check (price_nad >= 0),
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists driving_school_packages_name_key on public.driving_school_packages (name);

-- Bookings / inquiries
create table if not exists public.driving_school_bookings (
  id uuid primary key default uuid_generate_v4(),
  package_id uuid references public.driving_school_packages(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  message text,
  preferred_date date,
  preferred_time text,
  preferred_dates text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.driving_school_packages enable row level security;
alter table public.driving_school_bookings enable row level security;

-- Packages: public read active; admin full
drop policy if exists driving_school_packages_read_public on public.driving_school_packages;
create policy driving_school_packages_read_public on public.driving_school_packages
  for select using (is_active = true);

drop policy if exists driving_school_packages_all_admin on public.driving_school_packages;
create policy driving_school_packages_all_admin on public.driving_school_packages
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Bookings: anyone insert; admin read/update/delete
drop policy if exists driving_school_bookings_insert on public.driving_school_bookings;
create policy driving_school_bookings_insert on public.driving_school_bookings
  for insert to anon, authenticated with check (true);

drop policy if exists driving_school_bookings_select_admin on public.driving_school_bookings;
create policy driving_school_bookings_select_admin on public.driving_school_bookings
  for select to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

drop policy if exists driving_school_bookings_update_admin on public.driving_school_bookings;
create policy driving_school_bookings_update_admin on public.driving_school_bookings
  for update to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

drop policy if exists driving_school_bookings_delete_admin on public.driving_school_bookings;
create policy driving_school_bookings_delete_admin on public.driving_school_bookings
  for delete to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- updated_at trigger
create or replace function public.driving_school_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists driving_school_packages_updated_at on public.driving_school_packages;
create trigger driving_school_packages_updated_at
  before update on public.driving_school_packages
  for each row execute function public.driving_school_updated_at();

drop trigger if exists driving_school_bookings_updated_at on public.driving_school_bookings;
create trigger driving_school_bookings_updated_at
  before update on public.driving_school_bookings
  for each row execute function public.driving_school_updated_at();

-- Seed packages: N$130/hr. 5h=650, 10h=1300, 15h=1950, 20h=2500, 30h=3700 (discount on larger)
insert into public.driving_school_packages (name, description, hours, price_nad, display_order) values
  ('Starter – 5 hours', '5 hours of driving lessons. Ideal to get started.', 5, 650, 1),
  ('Standard – 10 hours', '10 hours of driving lessons. Good for building confidence.', 10, 1300, 2),
  ('Extended – 15 hours', '15 hours of driving lessons. Recommended for most learners.', 15, 1950, 3),
  ('Intensive – 20 hours', '20 hours at a discounted rate. Best value.', 20, 2500, 4),
  ('Complete – 30 hours', '30 hours at best rate. Full preparation for the test.', 30, 3700, 5)
on conflict (name) do nothing;
