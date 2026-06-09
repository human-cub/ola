-- Phase 2: master toggle for the group-price curtain. Default OFF (admin enables manually).
INSERT INTO public.app_settings (key, value) VALUES ('price_curtain_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
