-- Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "Users can insert cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert waiting list items" ON public.waiting_list_items;

-- Create more specific INSERT policies for cart_items
-- Allow authenticated users to insert with their user_id
CREATE POLICY "Authenticated users can insert cart items"
ON public.cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert with session_id only
CREATE POLICY "Anonymous users can insert cart items with session"
ON public.cart_items FOR INSERT
TO anon
WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Create more specific INSERT policies for waiting_list_items
CREATE POLICY "Authenticated users can insert waiting list items"
ON public.waiting_list_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert waiting list items with session"
ON public.waiting_list_items FOR INSERT
TO anon
WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Update SELECT/UPDATE/DELETE policies for cart_items to be more specific
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

CREATE POLICY "Authenticated users can view own cart items"
ON public.cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view cart items by session"
ON public.cart_items FOR SELECT
TO anon
USING (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can update own cart items"
ON public.cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can update cart items by session"
ON public.cart_items FOR UPDATE
TO anon
USING (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can delete own cart items"
ON public.cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete cart items by session"
ON public.cart_items FOR DELETE
TO anon
USING (session_id IS NOT NULL);

-- Update SELECT/UPDATE/DELETE policies for waiting_list_items
DROP POLICY IF EXISTS "Users can view own waiting list items" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Users can update own waiting list items" ON public.waiting_list_items;
DROP POLICY IF EXISTS "Users can delete own waiting list items" ON public.waiting_list_items;

CREATE POLICY "Authenticated users can view own waiting list items"
ON public.waiting_list_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view waiting list items by session"
ON public.waiting_list_items FOR SELECT
TO anon
USING (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can update own waiting list items"
ON public.waiting_list_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can update waiting list items by session"
ON public.waiting_list_items FOR UPDATE
TO anon
USING (session_id IS NOT NULL);

CREATE POLICY "Authenticated users can delete own waiting list items"
ON public.waiting_list_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete waiting list items by session"
ON public.waiting_list_items FOR DELETE
TO anon
USING (session_id IS NOT NULL);

-- Admin policies for cart and waiting list management
CREATE POLICY "Admins can view all cart items"
ON public.cart_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all waiting list items"
ON public.waiting_list_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));