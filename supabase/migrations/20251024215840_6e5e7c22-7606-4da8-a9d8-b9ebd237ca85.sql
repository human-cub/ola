-- Drop and recreate the insert policy for orders to ensure it allows all inserts
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a policy that explicitly allows all users (including anonymous) to insert orders
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (true);