-- Drop existing insert policy
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

-- Create policy that explicitly allows all roles including anon
CREATE POLICY "orders_insert_policy"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);