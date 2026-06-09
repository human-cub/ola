-- BUG FIX: the price curtain is read client-side by ANONYMOUS visitors, but app_settings
-- RLS only allowed authenticated SELECT -> anon got zero rows -> curtain (and viral UI
-- flags) never activated for the exact audience they target. Allow anon + authenticated
-- to read ONLY these public, non-sensitive UI flags.
CREATE POLICY "Anyone can read public UI flags" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('price_curtain_enabled', 'viral_enabled', 'referral_unlock_clicks'));
