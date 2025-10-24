-- Drop existing insert policy
DROP POLICY IF EXISTS "Enable insert for anon and authenticated users" ON public.orders;

-- Create new policy that explicitly allows anon and authenticated users to insert
CREATE POLICY "Anyone can insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);