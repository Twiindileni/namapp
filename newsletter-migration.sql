-- Newsletter columns for the public.users table
-- Run this once in the Supabase SQL editor.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS newsletter_subscribed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribe_token     uuid    NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS welcome_email_sent    boolean NOT NULL DEFAULT false;

-- Ensure every existing row that somehow has a NULL token gets a fresh UUID.
UPDATE public.users
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

-- Index so the unsubscribe endpoint can look up the token quickly.
CREATE UNIQUE INDEX IF NOT EXISTS users_unsubscribe_token_idx
  ON public.users (unsubscribe_token);
