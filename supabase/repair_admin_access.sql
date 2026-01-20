-- ==============================================================================
-- SCRIPT DE REPARACIÓN MANUAL: FORZAR ADMIN
-- Ejecuta esto en el Editor SQL cambiando 'TU_EMAIL_AQUI' por tu correo real.
-- ==============================================================================

-- 1. Variables (Cambia el email abajo)
DO $$
DECLARE
  target_email text := 'TU_EMAIL_AQUI'; -- <<< PON TU EMAIL EXACTO AQUÍ
  user_record record;
BEGIN
  -- Buscar usuario en auth.users
  SELECT * INTO user_record FROM auth.users WHERE email = target_email;

  IF user_record.id IS NULL THEN
    RAISE NOTICE 'No se encontró el usuario con email: %', target_email;
  ELSE
    -- 2. Asegurar que existe en Profiles
    INSERT INTO public.profiles (id, email, role, subscription_status, created_at, updated_at)
    VALUES (user_record.id, target_email, 'admin', 'active', now(), now())
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',               -- Forzar Admin
      subscription_status = 'active', -- Forzar Activo
      updated_at = now();

    -- 3. Sincronizar Metadata (Auth) por seguridad
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
    WHERE id = user_record.id;

    RAISE NOTICE '¡ÉXITO! Usuario % es ahora ADMIN y tiene perfil activo.', target_email;
  END IF;
END;
$$;
