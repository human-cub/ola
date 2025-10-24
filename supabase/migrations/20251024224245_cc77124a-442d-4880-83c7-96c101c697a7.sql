-- Полностью отключаем RLS для таблицы orders
-- Это позволит ЛЮБОМУ пользователю вставлять данные без проверок
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Удаляем все RLS политики, они больше не нужны для orders
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Создаём новые простые политики только для админов (для просмотра в админ-панели)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Админы могут делать всё
CREATE POLICY "Admins full access" 
ON public.orders 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ВСЕ (включая анонимов) могут вставлять заказы
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);