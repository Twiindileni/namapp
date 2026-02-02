-- Fix RLS Recursion/Access Issues using Security Definer Function

-- 1. Create a secure function to check if a user is an admin
-- This function runs with "SECURITY DEFINER" privileges, meaning it bypasses RLS
-- to read the users table safely, preventing recursion or permission errors.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies on orders
DROP POLICY IF EXISTS orders_read_admin ON public.orders;
DROP POLICY IF EXISTS orders_update_admin ON public.orders;
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_read_own ON public.orders;
DROP POLICY IF EXISTS orders_update_own ON public.orders; 
DROP POLICY IF EXISTS orders_delete_admin ON public.orders;

-- 3. Re-create policies using the new secure function

-- Admin Read
CREATE POLICY orders_read_admin ON public.orders 
FOR SELECT 
TO authenticated 
USING ( public.is_admin() );

-- Admin Update
CREATE POLICY orders_update_admin ON public.orders 
FOR UPDATE 
TO authenticated 
USING ( public.is_admin() );

-- Admin Delete (Adding just in case)
CREATE POLICY orders_delete_admin ON public.orders 
FOR DELETE 
TO authenticated 
USING ( public.is_admin() );

-- Public Insert
CREATE POLICY orders_insert_public ON public.orders 
FOR INSERT 
TO authenticated, anon 
WITH CHECK (true);

-- User Read Own
CREATE POLICY orders_read_own ON public.orders 
FOR SELECT 
TO authenticated 
USING ( user_email = (select email from auth.users where id = auth.uid()) );

-- User Update Own
CREATE POLICY orders_update_own ON public.orders 
FOR UPDATE 
TO authenticated 
USING ( user_email = (select email from auth.users where id = auth.uid()) );

-- 4. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
