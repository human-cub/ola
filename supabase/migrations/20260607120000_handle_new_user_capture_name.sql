-- handle_new_user: capture name + provider from auth metadata
-- Google: given_name/family_name; email signup: first_name/last_name; fallback: split full_name.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full text := COALESCE(v_meta->>'full_name', v_meta->>'name', '');
  v_first text := COALESCE(v_meta->>'given_name', v_meta->>'first_name', NULLIF(split_part(v_full,' ',1),''));
  v_last text := COALESCE(v_meta->>'family_name', v_meta->>'last_name', NULLIF(btrim(regexp_replace(v_full,'^\S+\s*','')),''));
  v_provider text := COALESCE(NEW.raw_app_meta_data->>'provider','email');
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, registration_method, profile_completed)
  VALUES (NEW.id, NEW.email, v_first, v_last, v_provider, false);
  RETURN NEW;
END;
$function$;
