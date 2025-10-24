-- Drop the current insert policy
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders v2" ON public.orders;

-- Create a simple policy using 'public' role (includes anon and authenticated)
CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);