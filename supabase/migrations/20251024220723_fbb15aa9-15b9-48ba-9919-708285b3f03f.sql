-- Drop all existing insert policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a single comprehensive insert policy for both anon and authenticated
CREATE POLICY "Enable insert for anon and authenticated users"
ON public.orders
FOR INSERT
WITH CHECK (true);