-- Photography System Migration
-- Run this in your Supabase SQL Editor

-- Photography Categories
create table if not exists public.photography_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text not null,
  cover_image_url text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photography Photos
create table if not exists public.photography_photos (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.photography_categories(id) on delete cascade,
  title text,
  description text,
  image_url text not null,
  thumbnail_url text,
  is_featured boolean default false,
  display_order integer default 0,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photography Packages (Pricing)
create table if not exists public.photography_packages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  duration text not null,
  features jsonb not null default '[]',
  is_popular boolean default false,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photography Hero Slides
create table if not exists public.photography_hero_slides (
  id uuid primary key default uuid_generate_v4(),
  title text,
  subtitle text,
  image_url text not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for photography tables
alter table public.photography_categories enable row level security;
alter table public.photography_photos enable row level security;
alter table public.photography_packages enable row level security;
alter table public.photography_hero_slides enable row level security;

-- Photography Categories policies
-- Public can read active categories
drop policy if exists photography_categories_read_public on public.photography_categories;
create policy photography_categories_read_public on public.photography_categories 
  for select using (is_active = true);

-- Admin can do everything
drop policy if exists photography_categories_all_admin on public.photography_categories;
create policy photography_categories_all_admin on public.photography_categories 
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Photography Photos policies
-- Public can read all photos from active categories
drop policy if exists photography_photos_read_public on public.photography_photos;
create policy photography_photos_read_public on public.photography_photos 
  for select using (
    exists (select 1 from public.photography_categories c where c.id = category_id and c.is_active = true)
  );

-- Admin can do everything
drop policy if exists photography_photos_all_admin on public.photography_photos;
create policy photography_photos_all_admin on public.photography_photos 
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Photography Packages policies
-- Public can read active packages
drop policy if exists photography_packages_read_public on public.photography_packages;
create policy photography_packages_read_public on public.photography_packages 
  for select using (is_active = true);

-- Admin can do everything
drop policy if exists photography_packages_all_admin on public.photography_packages;
create policy photography_packages_all_admin on public.photography_packages 
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Photography Hero Slides policies
-- Public can read active slides
drop policy if exists photography_hero_slides_read_public on public.photography_hero_slides;
create policy photography_hero_slides_read_public on public.photography_hero_slides 
  for select using (is_active = true);

-- Admin can do everything
drop policy if exists photography_hero_slides_all_admin on public.photography_hero_slides;
create policy photography_hero_slides_all_admin on public.photography_hero_slides 
  for all to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Insert initial data
INSERT INTO public.photography_categories (name, slug, description, display_order) VALUES
  ('Weddings', 'weddings', 'Capturing your special day with elegance and emotion', 1),
  ('Birthday Parties', 'birthdays', 'Fun and vibrant moments from your celebrations', 2),
  ('Corporate Events', 'corporate', 'Professional coverage of your business gatherings', 3),
  ('Portrait Sessions', 'portraits', 'Beautiful and timeless individual and family portraits', 4),
  ('Maternity & Newborn', 'maternity', 'Precious moments of new life and growing families', 5),
  ('Graduations', 'graduation', 'Celebrate academic achievements with stunning photos', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.photography_packages (name, price, duration, features, is_popular, display_order) VALUES
  ('Basic Package', 500, '2 hours', '["2 hours of photography", "50 edited high-resolution photos", "Online gallery", "1 location", "Digital download"]', false, 1),
  ('Standard Package', 1200, '4 hours', '["4 hours of photography", "150 edited high-resolution photos", "Online gallery", "Up to 2 locations", "Digital download", "10 printed photos (5x7)", "Pre-event consultation"]', true, 2),
  ('Premium Package', 2500, 'Full day', '["Full day coverage (8+ hours)", "300+ edited high-resolution photos", "Premium online gallery", "Unlimited locations", "Digital download", "30 printed photos (various sizes)", "Photo album (20 pages)", "Pre & post-event consultation", "Second photographer available"]', false, 3)
ON CONFLICT DO NOTHING;

-- Photography Bookings
create table if not exists public.photography_bookings (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_type text not null,
  event_date date not null,
  event_location text,
  package_id uuid references public.photography_packages(id) on delete set null,
  preferred_package_name text,
  guest_count integer,
  special_requests text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.photography_bookings enable row level security;

-- Customers can create their own bookings
create policy "Anyone can create bookings"
  on public.photography_bookings for insert
  to public
  with check (true);

-- Customers can view their own bookings by email
create policy "Customers can view own bookings"
  on public.photography_bookings for select
  to public
  using (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can view all bookings
create policy "Admins can view all bookings"
  on public.photography_bookings for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update all bookings
create policy "Admins can update bookings"
  on public.photography_bookings for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete bookings
create policy "Admins can delete bookings"
  on public.photography_bookings for delete
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create updated_at trigger
create or replace function public.update_photography_bookings_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_photography_bookings_updated_at
  before update on public.photography_bookings
  for each row
  execute function public.update_photography_bookings_updated_at();

-- Allow customers to view their own loan applications by email
drop policy if exists loans_read_own on public.loans;
create policy loans_read_own on public.loans for select to authenticated using (
  email = (select email from auth.users where id = auth.uid())
);

-- ============================================
-- IMEI Device Tracking System
-- ============================================

-- Registered Devices Table
create table if not exists public.registered_devices (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  device_name text not null,
  imei_number text not null,
  brand text,
  model text,
  color text,
  purchase_date date,
  serial_number text,
  device_photo_url text,
  status text default 'active' check (status in ('active', 'lost', 'stolen', 'found', 'recovered')),
  
  -- Tracking request details
  tracking_requested boolean default false,
  tracking_request_date timestamp with time zone,
  incident_date date,
  incident_location text,
  police_report_number text,
  description text,
  
  -- Admin management
  admin_notes text,
  admin_status text default 'pending' check (admin_status in ('pending', 'investigating', 'resolved', 'closed')),
  resolved_date timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists idx_registered_devices_user_email on public.registered_devices(user_email);
create index if not exists idx_registered_devices_imei on public.registered_devices(imei_number);
create index if not exists idx_registered_devices_status on public.registered_devices(status);
create index if not exists idx_registered_devices_tracking on public.registered_devices(tracking_requested);

-- Enable RLS
alter table public.registered_devices enable row level security;

-- Customers can create their own device registrations
drop policy if exists registered_devices_insert_own on public.registered_devices;
create policy registered_devices_insert_own on public.registered_devices 
  for insert
  to authenticated
  with check (user_email = (select email from auth.users where id = auth.uid()));

-- Customers can view their own devices
drop policy if exists registered_devices_select_own on public.registered_devices;
create policy registered_devices_select_own on public.registered_devices 
  for select
  to authenticated
  using (user_email = (select email from auth.users where id = auth.uid()));

-- Customers can update their own devices
drop policy if exists registered_devices_update_own on public.registered_devices;
create policy registered_devices_update_own on public.registered_devices 
  for update
  to authenticated
  using (user_email = (select email from auth.users where id = auth.uid()));

-- Customers can delete their own devices
drop policy if exists registered_devices_delete_own on public.registered_devices;
create policy registered_devices_delete_own on public.registered_devices 
  for delete
  to authenticated
  using (user_email = (select email from auth.users where id = auth.uid()));

-- Admins can view all devices
drop policy if exists registered_devices_admin_select on public.registered_devices;
create policy registered_devices_admin_select on public.registered_devices 
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update all devices
drop policy if exists registered_devices_admin_update on public.registered_devices;
create policy registered_devices_admin_update on public.registered_devices 
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create updated_at trigger
create or replace function public.update_registered_devices_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_registered_devices_updated_at on public.registered_devices;
create trigger update_registered_devices_updated_at
  before update on public.registered_devices
  for each row
  execute function public.update_registered_devices_updated_at();
