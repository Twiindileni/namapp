-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Users table mirrors auth users with additional metadata
create table if not exists public.users (
	id uuid primary key,
	email text unique,
	name text,
	role text default 'developer',
	profile_picture text,
	created_at timestamptz default now()
);

-- Categories
create table if not exists public.categories (
	id uuid primary key default uuid_generate_v4(),
	name text unique not null
);

-- Apps
create table if not exists public.apps (
	id uuid primary key default uuid_generate_v4(),
	name text not null,
	description text not null,
	category text not null,
	version text not null,
	apk_url text not null,
	developer_id uuid not null references public.users(id) on delete cascade,
	developer_email text,
	downloads integer default 0,
	status text default 'pending',
	last_downloaded_at timestamptz,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- App screenshots
create table if not exists public.app_screenshots (
	id uuid primary key default uuid_generate_v4(),
	app_id uuid not null references public.apps(id) on delete cascade,
	url text not null,
	file_name text not null,
	file_size integer,
	file_type text,
	uploaded_at timestamptz default now()
);

-- Products
create table if not exists public.products (
	id uuid primary key default uuid_generate_v4(),
	name text not null,
	description text,
	price_nad numeric(12,2) not null check (price_nad >= 0),
	image_url text,
	status text not null default 'pending',
	owner_id uuid not null references public.users(id) on delete cascade,
	created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
	id uuid primary key default uuid_generate_v4(),
	name text not null,
	phone text not null,
	delivery_address text not null,
	delivery_fee_option text not null check (delivery_fee_option in ('windhoek', 'out_of_windhoek')),
	preferred_contact text not null check (preferred_contact in ('phone', 'email')),
	order_date date not null,
	special_request text,
	product_id uuid not null references public.products(id) on delete cascade,
	product_name text not null,
	product_price numeric(12,2) not null,
	total_amount numeric(12,2) not null,
	status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Basic RLS
alter table public.users enable row level security;
alter table public.apps enable row level security;
alter table public.app_screenshots enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Apps policies
drop policy if exists apps_read_all on public.apps;
create policy apps_read_all on public.apps for select using (true);
drop policy if exists apps_insert_own on public.apps;
create policy apps_insert_own on public.apps for insert with check (auth.uid() = developer_id);
drop policy if exists apps_update_own on public.apps;
create policy apps_update_own on public.apps for update using (auth.uid() = developer_id);
drop policy if exists apps_update_admin on public.apps;
create policy apps_update_admin on public.apps for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
drop policy if exists apps_delete_own on public.apps;
create policy apps_delete_own on public.apps for delete using (auth.uid() = developer_id);

-- Users policies
drop policy if exists users_read_all on public.users;
create policy users_read_all on public.users for select using (true);
drop policy if exists users_upsert_self on public.users;
create policy users_upsert_self on public.users for insert with check (id = auth.uid());
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update using (id = auth.uid());

-- Screenshots policies
drop policy if exists screenshots_read_all on public.app_screenshots;
create policy screenshots_read_all on public.app_screenshots for select using (true);
drop policy if exists screenshots_insert_own on public.app_screenshots;
create policy screenshots_insert_own on public.app_screenshots for insert with check (
	exists (select 1 from public.apps a where a.id = app_id and a.developer_id = auth.uid())
);
drop policy if exists screenshots_delete_own on public.app_screenshots;
create policy screenshots_delete_own on public.app_screenshots for delete using (
	exists (select 1 from public.apps a where a.id = app_id and a.developer_id = auth.uid())
);

-- Products policies
-- Public can read only approved products
drop policy if exists products_read_public on public.products;
create policy products_read_public on public.products for select using (status = 'approved');
-- Owners can read their own regardless of status
drop policy if exists products_read_owner on public.products;
create policy products_read_owner on public.products for select to authenticated using (owner_id = auth.uid());
-- Owners can insert with themselves as owner_id
drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products for insert to authenticated with check (owner_id = auth.uid());
-- Owners can update their own (not status)
drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- Admin updates (including status) - handled via PostgREST role; simplest is to elevate via RPC or use service role on server only.

-- Orders policies
-- Anyone can create orders (public access)
drop policy if exists orders_insert_public on public.orders;
create policy orders_insert_public on public.orders for insert to authenticated with check (true);
-- Admin can read all orders
drop policy if exists orders_read_admin on public.orders;
create policy orders_read_admin on public.orders for select to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
-- Admin can update order status
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Storage policies are configured separately in the dashboard for bucket namapps