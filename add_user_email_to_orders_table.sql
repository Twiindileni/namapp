-- Add user_email column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_email text;

-- Create index for faster lookups based on user email
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);

-- Enable RLS (it might be already enabled, but safe to re-run)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
DROP POLICY IF EXISTS orders_read_own ON public.orders;
CREATE POLICY orders_read_own ON public.orders 
FOR SELECT 
TO authenticated 
USING (user_email = (select email from auth.users where id = auth.uid()));

-- Allow users to update their own orders (if needed, e.g. cancel)
DROP POLICY IF EXISTS orders_update_own ON public.orders;
CREATE POLICY orders_update_own ON public.orders 
FOR UPDATE 
TO authenticated 
USING (user_email = (select email from auth.users where id = auth.uid()));
