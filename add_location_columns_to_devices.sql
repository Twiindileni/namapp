-- Add latitude and longitude columns to registered_devices table
ALTER TABLE public.registered_devices 
ADD COLUMN IF NOT EXISTS incident_latitude double precision,
ADD COLUMN IF NOT EXISTS incident_longitude double precision;

-- Enable Supabase Realtime for the registered_devices table
-- This allows the frontend to receive subscription updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.registered_devices;

-- Create an index for geospatial queries (optional but good practice if we add PostGIS later)
-- For now, standard btree on these columns is fine for simple lookups, 
-- but we don't strictly need them for the current simple fetching.

-- Update the RLS policy to ensure these new columns are writable by the owner
-- (The existing policies likely cover "all columns" or the specific row, but good to verify)
-- Existing policies: 
-- registered_devices_update_own: using (user_email = (select email from auth.users where id = auth.uid()));
-- This should already cover the new columns.

-- Grant permissions if necessary (usually authenticated role inherits table permissions)
GRANT SELECT, UPDATE ON public.registered_devices TO authenticated;
