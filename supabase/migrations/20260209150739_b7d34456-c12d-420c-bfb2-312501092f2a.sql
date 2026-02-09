-- Drop the old policy that blocks status transitions
DROP POLICY "Users can update own pending orders" ON public.user_orders;

-- Recreate with proper WITH CHECK that allows status transitions
CREATE POLICY "Users can update own pending orders"
ON public.user_orders
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending'::extended_order_status)
WITH CHECK (auth.uid() = user_id);