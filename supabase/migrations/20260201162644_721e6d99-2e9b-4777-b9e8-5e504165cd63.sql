-- Remove vulnerable anonymous cart RLS policies
-- According to the memory, anonymous users are redirected to login before adding items
-- These policies allow any anonymous user to access ALL anonymous carts by bypassing client code

-- Remove anonymous cart_items policies
DROP POLICY IF EXISTS "Anonymous users can view cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can update cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can delete cart items by session" ON public.cart_items;
DROP POLICY IF EXISTS "Anonymous users can insert cart items with session" ON public.cart_items;
DROP POLICY IF EXISTS "Authenticated users can claim orphan cart items" ON public.cart_items;

-- Remove anonymous waiting_list_items policies
DROP POLICY IF EXISTS "Anonymous users can view waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can update waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can delete waiting list items by session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Anonymous users can insert waiting list items with session" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Authenticated users can claim orphan waiting list items" ON public.waiting_list_items;