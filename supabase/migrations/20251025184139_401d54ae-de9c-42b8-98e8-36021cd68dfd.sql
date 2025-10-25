-- Drop ALL existing policies on orders table
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Create fresh policies
-- Allow anyone to insert orders (including anonymous users)
CREATE POLICY "orders_insert_policy"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can select orders
CREATE POLICY "orders_select_policy"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update orders
CREATE POLICY "orders_update_policy"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete orders
CREATE POLICY "orders_delete_policy"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));