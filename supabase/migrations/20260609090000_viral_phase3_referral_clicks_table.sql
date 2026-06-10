-- Phase 3: track unique link clicks (the "share" path to the referral reward).
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ref_code, visitor_hash)
);
CREATE INDEX IF NOT EXISTS referral_clicks_ref_code_idx ON public.referral_clicks (ref_code);
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_clicks_rewarded_at int NOT NULL DEFAULT 0;
