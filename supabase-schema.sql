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

-- Product Ratings
create table if not exists public.product_ratings (
	id uuid primary key default uuid_generate_v4(),
	product_id uuid not null references public.products(id) on delete cascade,
	user_id uuid references auth.users(id) on delete set null,
	rating integer not null check (rating >= 1 and rating <= 5),
	review text,
	user_name text not null,
	user_email text,
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	unique(product_id, user_id)
);

-- Basic RLS
alter table public.users enable row level security;
alter table public.apps enable row level security;
alter table public.app_screenshots enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.product_ratings enable row level security;

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

-- Product Ratings policies
-- Anyone can read ratings
drop policy if exists ratings_read_all on public.product_ratings;
create policy ratings_read_all on public.product_ratings for select using (true);
-- Anyone can insert ratings (public access)
drop policy if exists ratings_insert_public on public.product_ratings;
create policy ratings_insert_public on public.product_ratings for insert with check (true);
-- Users can update their own ratings
drop policy if exists ratings_update_own on public.product_ratings;
create policy ratings_update_own on public.product_ratings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Users can delete their own ratings
drop policy if exists ratings_delete_own on public.product_ratings;
create policy ratings_delete_own on public.product_ratings for delete using (user_id = auth.uid());

-- Storage policies are configured separately in the dashboard for bucket namapps

-- Forex Signals
create table if not exists public.forex_signals (
  id uuid primary key default uuid_generate_v4(),
  instrument text not null,
  side text not null check (side in ('BUY','SELL')),
  entry_point numeric(18,6) not null,
  take_profit_1 numeric(18,6),
  take_profit_2 numeric(18,6),
  take_profit_3 numeric(18,6),
  rating integer check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid not null references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.forex_signals enable row level security;

-- Public can read only approved signals
drop policy if exists forex_signals_read_public on public.forex_signals;
create policy forex_signals_read_public on public.forex_signals for select using (status = 'approved');

-- Admins can read all
drop policy if exists forex_signals_read_admin on public.forex_signals;
create policy forex_signals_read_admin on public.forex_signals for select to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Admins can insert
drop policy if exists forex_signals_insert_admin on public.forex_signals;
create policy forex_signals_insert_admin on public.forex_signals for insert to authenticated with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Admins can update (approve/reject/edit)
drop policy if exists forex_signals_update_admin on public.forex_signals;
create policy forex_signals_update_admin on public.forex_signals for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Admins can delete
drop policy if exists forex_signals_delete_admin on public.forex_signals;
create policy forex_signals_delete_admin on public.forex_signals for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Loans
create table if not exists public.loans (
  id uuid primary key default uuid_generate_v4(),
  applicant_name text not null,
  phone text not null,
  email text,
  amount numeric(12,2) not null check (amount > 0),
  repayment_amount numeric(12,2) not null check (repayment_amount >= amount),
  collateral_type text check (collateral_type in ('fridge','phone','laptop')),
  collateral_description text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','disbursed','repaid','defaulted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.loan_collaterals (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  type text not null check (type in ('fridge','phone','laptop')),
  description text,
  estimated_value numeric(12,2),
  created_at timestamptz default now()
);

alter table public.loans enable row level security;
alter table public.loan_collaterals enable row level security;

-- Public can insert loan requests
drop policy if exists loans_insert_public on public.loans;
create policy loans_insert_public on public.loans for insert with check (true);

-- Admins can read and update all loans
drop policy if exists loans_read_admin on public.loans;
create policy loans_read_admin on public.loans for select to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
drop policy if exists loans_update_admin on public.loans;
create policy loans_update_admin on public.loans for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Collaterals policies
drop policy if exists loan_collaterals_insert_public on public.loan_collaterals;
create policy loan_collaterals_insert_public on public.loan_collaterals for insert with check (true);
drop policy if exists loan_collaterals_read_admin on public.loan_collaterals;
create policy loan_collaterals_read_admin on public.loan_collaterals for select to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Lifecycle timestamps for loans (idempotent)
alter table public.loans add column if not exists approved_at timestamptz;
alter table public.loans add column if not exists disbursed_at timestamptz;
alter table public.loans add column if not exists repaid_at timestamptz;
alter table public.loans add column if not exists defaulted_at timestamptz;