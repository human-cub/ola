-- Create enum for order types
CREATE TYPE public.order_type AS ENUM ('immediate', 'collective');

-- Create enum for extended order status
CREATE TYPE public.extended_order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create cart_items table for immediate purchases
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for guest users
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  flavor TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
  price_per_unit NUMERIC(10,2) NOT NULL,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waiting_list_items table for collective purchases
CREATE TABLE public.waiting_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for guest users
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  flavor TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
  current_price_per_unit NUMERIC(10,2) NOT NULL,
  product_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_orders table for order history
CREATE TABLE public.user_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  order_type order_type NOT NULL DEFAULT 'immediate',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_address JSONB,
  payment_method TEXT,
  status extended_order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  collective_close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX idx_cart_items_session ON public.cart_items(session_id);
CREATE INDEX idx_waiting_list_user ON public.waiting_list_items(user_id);
CREATE INDEX idx_waiting_list_session ON public.waiting_list_items(session_id);
CREATE INDEX idx_user_orders_user ON public.user_orders(user_id);
CREATE INDEX idx_user_orders_status ON public.user_orders(status);
CREATE INDEX idx_user_orders_type ON public.user_orders(order_type);
CREATE INDEX idx_user_orders_number ON public.user_orders(order_number);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for cart_items
CREATE POLICY "Users can view own cart items"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert cart items"
ON public.cart_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own cart items"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete own cart items"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- RLS policies for waiting_list_items
CREATE POLICY "Users can view own waiting list items"
ON public.waiting_list_items FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert waiting list items"
ON public.waiting_list_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own waiting list items"
ON public.waiting_list_items FOR UPDATE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete own waiting list items"
ON public.waiting_list_items FOR DELETE
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- RLS policies for user_orders
CREATE POLICY "Users can view own orders"
ON public.user_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON public.user_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
ON public.user_orders FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admin policies for user_orders
CREATE POLICY "Admins can view all orders"
ON public.user_orders FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all orders"
ON public.user_orders FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete orders"
ON public.user_orders FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger for auto-generating order number
CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON public.user_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION public.generate_order_number();

-- Function to update updated_at on cart_items
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update updated_at on waiting_list_items
CREATE TRIGGER update_waiting_list_updated_at
BEFORE UPDATE ON public.waiting_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update updated_at on user_orders
CREATE TRIGGER update_user_orders_updated_at
BEFORE UPDATE ON public.user_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for cart and waiting list
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_orders;