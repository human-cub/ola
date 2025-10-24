-- Даем явные права на INSERT для anon и authenticated
GRANT INSERT ON public.orders TO anon;
GRANT SELECT ON public.orders TO anon;
GRANT INSERT ON public.orders TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;