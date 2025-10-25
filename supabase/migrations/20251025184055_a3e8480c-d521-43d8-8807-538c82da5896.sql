-- Drop existing insert policy
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

-- Create new policy that explicitly allows anonymous inserts
CREATE POLICY "Allow anonymous inserts"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;