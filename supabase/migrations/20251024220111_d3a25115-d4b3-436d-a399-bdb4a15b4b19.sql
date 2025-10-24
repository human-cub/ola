-- Drop the existing insert policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a new policy that explicitly allows anonymous users to insert orders
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);