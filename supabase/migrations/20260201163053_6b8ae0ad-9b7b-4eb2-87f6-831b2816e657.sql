-- Add explicit deny policies for anonymous access to sensitive tables
-- This prevents any anonymous queries to these tables containing PII

-- Deny anonymous access to profiles table (contains emails, phones, addresses)
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to login_history table (contains IP addresses, user agents)
CREATE POLICY "Deny public access to login_history" 
ON public.login_history 
FOR SELECT 
TO anon 
USING (false);