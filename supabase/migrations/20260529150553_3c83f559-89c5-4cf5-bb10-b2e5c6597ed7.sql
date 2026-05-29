
-- 1. Добавляем mayorista в order_type
ALTER TYPE public.order_type ADD VALUE IF NOT EXISTS 'mayorista';

-- 2. Таблица токенов приглашений
CREATE TABLE IF NOT EXISTS public.wholesale_invite_tokens (
  token UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.wholesale_leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_by_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_wholesale_invite_tokens_lead ON public.wholesale_invite_tokens(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wholesale_invite_tokens TO authenticated;
GRANT ALL ON public.wholesale_invite_tokens TO service_role;

ALTER TABLE public.wholesale_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invite tokens"
  ON public.wholesale_invite_tokens FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can create invite tokens"
  ON public.wholesale_invite_tokens FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update invite tokens"
  ON public.wholesale_invite_tokens FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete invite tokens"
  ON public.wholesale_invite_tokens FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Колонка mode в cart_items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'retail';

ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_mode_check;
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_mode_check CHECK (mode IN ('retail', 'mayorista'));

-- 4. Функция: генерация токена (только admin)
CREATE OR REPLACE FUNCTION public.generate_wholesale_invite(_lead_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing UUID;
  new_token UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  SELECT token INTO existing
  FROM public.wholesale_invite_tokens
  WHERE lead_id = _lead_id AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  INSERT INTO public.wholesale_invite_tokens(lead_id)
  VALUES (_lead_id)
  RETURNING token INTO new_token;

  RETURN new_token;
END;
$$;

-- 5. Функция: публичная валидация токена
CREATE OR REPLACE FUNCTION public.validate_wholesale_invite(_token UUID)
RETURNS TABLE(valid BOOLEAN, lead_id UUID, full_name TEXT, phone TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (t.used_at IS NULL) AS valid,
    t.lead_id,
    l.full_name,
    l.phone
  FROM public.wholesale_invite_tokens t
  JOIN public.wholesale_leads l ON l.id = t.lead_id
  WHERE t.token = _token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_wholesale_invite(UUID) TO anon, authenticated;

-- 6. Функция: активация (выдаёт роль mayorista текущему пользователю и помечает токен)
CREATE OR REPLACE FUNCTION public.claim_wholesale_invite(_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  is_valid BOOLEAN;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT (used_at IS NULL) INTO is_valid
  FROM public.wholesale_invite_tokens
  WHERE token = _token;

  IF is_valid IS NULL THEN
    RAISE EXCEPTION 'invalid token';
  END IF;

  IF NOT is_valid THEN
    RAISE EXCEPTION 'token already used';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (uid, 'mayorista'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.wholesale_invite_tokens
  SET used_at = now(), used_by_user_id = uid
  WHERE token = _token;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_wholesale_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_wholesale_invite(UUID) TO authenticated;
