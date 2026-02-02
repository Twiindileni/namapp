-- ============================================================
-- Users table: allow SELECT so RLS subqueries and client reads work
-- Run this in Supabase SQL Editor if you still use client-side
-- access to orders (e.g. RLS policies that check public.users).
-- Admin orders page now uses server-side API (service role), so
-- this is optional but recommended for AuthContext and any RLS.
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own row (needed for:
-- - AuthContext reading role by id = auth.uid()
-- - RLS policies on other tables that do EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Optional: if you use is_admin() SECURITY DEFINER, no extra policy needed
-- for the function. This policy only helps direct client reads and RLS
-- subqueries that reference public.users.
