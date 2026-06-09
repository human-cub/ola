-- Guest-checkout accounts stay curtained (no group prices) until an admin promotes them.
-- is_guest = access flag (separate from registration_method which is kept as audit trail).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT false;
