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
