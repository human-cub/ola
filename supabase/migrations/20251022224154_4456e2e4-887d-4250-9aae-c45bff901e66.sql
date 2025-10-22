-- Función auxiliar para asignar rol de admin a un usuario por email
-- Los administradores pueden ejecutar: SELECT assign_admin_role('email@ejemplo.com');

CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar el ID del usuario por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Usuario no encontrado';
  END IF;
  
  -- Insertar el rol admin si no existe
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Rol de admin asignado exitosamente a ' || user_email;
END;
$$;