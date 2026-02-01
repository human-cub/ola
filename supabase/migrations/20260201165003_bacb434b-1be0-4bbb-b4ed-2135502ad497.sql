-- Remove vulnerable anonymous session-based RLS policies for cart_items
-- These policies check session_id IS NOT NULL but don't validate ownership
DROP POLICY IF EXISTS "Anonymous users can view cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can update cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can delete cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can insert cart items with session" ON public.cart_items;

-- Remove vulnerable anonymous session-based RLS policies for waiting_list_items
DROP POLICY IF EXISTS "Anonymous users can view waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can update waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can delete waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can insert waiting list items with session" ON public.waiting_list_items;