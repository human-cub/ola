-- 'guest' is a real role (shown in the admin Rol dropdown). Guest-checkout accounts
-- get this role and stay curtained until an admin changes their role to Cliente.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'guest';
