-- ==============================================
-- ADMIN: CREATE USER FUNCTION (RPC) - FIXED v2
-- ==============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION create_new_user(
    email text,
    password text,
    user_role text,
    user_credits int,
    creator_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- 1. Verificar permisos
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'reseller')
  ) THEN
    RAISE EXCEPTION 'Acceso Denegado: Permisos insuficientes.';
  END IF;

  -- 2. Encriptar contraseña
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  -- 3. Insertar en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('role', user_role),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- 4. Insertar identidad (FIX: Agregado provider_id)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id, -- REQUIRED FIELD
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    json_build_object('sub', new_user_id, 'email', email),
    'email',
    new_user_id::text, -- Usually the userUID or email depending on provider. For email provider, mostly user_id or email. Let's use user_id to be safe or email. Actually for email provider usually it matches id? No, let's use user_id to avoid unique constraint if email used elsewhere? Standard is often the unique ID from provider. For email provider it is often the email. 
    -- Let's try `new_user_id::text` first as it creates a unique identity link.
    -- Wait, looking at standard supabase data, provider_id for email provider is often the user_id.
    NULL,
    now(),
    now()
  );

  -- 5. Crear Perfil
  INSERT INTO public.profiles (id, role, credits, created_by, email)
  VALUES (new_user_id, user_role, user_credits, creator_id, email)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    credits = EXCLUDED.credits,
    created_by = EXCLUDED.created_by,
    email = EXCLUDED.email;

  -- 6. Descontar créditos (Revendedores)
  IF (SELECT role FROM profiles WHERE id = auth.uid()) = 'reseller' THEN
    UPDATE profiles 
    SET credits = credits - 1 
    WHERE id = auth.uid();
    
    IF (SELECT credits FROM profiles WHERE id = auth.uid()) < 0 THEN
        RAISE EXCEPTION 'Créditos insuficientes';
    END IF;
  END IF;

  RETURN new_user_id;
END;
$$;
