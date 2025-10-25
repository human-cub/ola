-- ПОЛНОСТЬЮ ОТКЛЮЧАЕМ RLS на таблице orders
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Удаляем ВСЕ политики с таблицы orders
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'orders' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
END $$;

-- Даём полные права на таблицу для всех ролей
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;