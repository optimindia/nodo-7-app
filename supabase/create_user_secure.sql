-- ==============================================
-- SECURE USER CREATION (v4 - UPSERT FIX)
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
  caller_role text;
BEGIN
  -- 1. Get Caller Role (Securely)
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- 2. Permission Checks
  IF caller_role NOT IN ('admin', 'reseller') THEN
    RAISE EXCEPTION 'Acceso Denegado.';
  END IF;

  -- Resellers CANNOT create Admins
  IF caller_role = 'reseller' AND user_role = 'admin' THEN
    RAISE EXCEPTION 'Seguridad: Los revendedores no pueden crear administradores.';
  END IF;

  -- 3. Encrypt Password
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  -- 4. Create Auth User
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    email, encrypted_pw, now(), 
    '{"provider": "email", "providers": ["email"]}', 
    json_build_object('role', user_role), 
    now(), now()
  ) RETURNING id INTO new_user_id;

  -- 5. Create Identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, json_build_object('sub', new_user_id, 'email', email), 
    'email', new_user_id::text, NULL, now(), now()
  );

  -- 6. Create Profile (Safe Upsert)
  -- Uses ON CONFLICT to handle cases where a Trigger might have already created the profile
  INSERT INTO public.profiles (id, role, credits, created_by, email, created_at)
  VALUES (new_user_id, user_role, user_credits, creator_id, email, now())
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    credits = EXCLUDED.credits,
    created_by = EXCLUDED.created_by,
    email = EXCLUDED.email;

  -- 7. Deduct Strategy
  IF caller_role = 'reseller' THEN
    UPDATE profiles 
    SET credits = credits - user_credits -- Deduct the credits GIVEN to the new user
    WHERE id = auth.uid();
    
    IF (SELECT credits FROM profiles WHERE id = auth.uid()) < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente para asignar estos créditos.';
    END IF;
  END IF;

  RETURN new_user_id;
END;
$$;
