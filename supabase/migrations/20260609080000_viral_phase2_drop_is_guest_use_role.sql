-- Replaced the is_guest flag with the 'guest' role (uses the existing role system). Drop the clutter.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_guest;
