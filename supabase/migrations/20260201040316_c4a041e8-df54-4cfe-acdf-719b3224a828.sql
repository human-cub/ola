-- Fix orders_insert_policy: Restrict INSERT to authenticated users only
-- This replaces the overly permissive 'true' check with requiring authentication

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

CREATE POLICY "orders_insert_policy" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);