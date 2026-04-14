-- Fix Orders Table Permissions and Structure

-- 1. Ensure user_email column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_email text;

-- 2. Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Reset ALL policies for orders table to ensure clean state

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS orders_read_admin ON public.orders;
DROP POLICY IF EXISTS orders_update_admin ON public.orders;
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_read_own ON public.orders;
DROP POLICY IF EXISTS orders_update_own ON public.orders; 

-- Policy: Admin can read all orders
CREATE POLICY orders_read_admin ON public.orders 
FOR SELECT 
TO authenticated 
USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Policy: Admin can update all orders
CREATE POLICY orders_update_admin ON public.orders 
FOR UPDATE 
TO authenticated 
USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Policy: Public/Anyone can insert orders (for checkout)
CREATE POLICY orders_insert_public ON public.orders 
FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

-- Policy: Users can view their own orders (My Orders)
CREATE POLICY orders_read_own ON public.orders 
FOR SELECT 
TO authenticated 
USING (user_email = (select email from auth.users where id = auth.uid()));

-- Policy: Users can update their own orders (e.g. valid actions if any)
CREATE POLICY orders_update_own ON public.orders 
FOR UPDATE 
TO authenticated 
USING (user_email = (select email from auth.users where id = auth.uid()));
