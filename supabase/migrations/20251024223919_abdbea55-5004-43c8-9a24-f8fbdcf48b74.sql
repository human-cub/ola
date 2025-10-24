-- Give explicit INSERT permission to anon role
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.orders TO authenticated;

-- Also grant USAGE and SELECT on the sequence for the ID
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;