-- Create wholesale leads table for storing catalog requests
CREATE TABLE public.wholesale_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wholesale_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit a lead
CREATE POLICY "Anyone can submit wholesale leads"
ON public.wholesale_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view/manage leads
CREATE POLICY "Admins can view all wholesale leads"
ON public.wholesale_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wholesale leads"
ON public.wholesale_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wholesale leads"
ON public.wholesale_leads
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_wholesale_leads_updated_at
BEFORE UPDATE ON public.wholesale_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for sorting
CREATE INDEX idx_wholesale_leads_created_at ON public.wholesale_leads (created_at DESC);