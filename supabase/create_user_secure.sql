-- ==============================================
-- SECURE USER CREATION (v5 - UUID PRE-GEN FIX)
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

  IF caller_role = 'reseller' AND user_role = 'admin' THEN
    RAISE EXCEPTION 'Seguridad: Los revendedores no pueden crear administradores.';
  END IF;

  -- 3. Pre-Generate UUID to ensure we have it
  new_user_id := gen_random_uuid();
  
  -- 4. Encrypt Password
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  -- 5. Create Auth User (Using Pre-Gen ID)
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
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    new_user_id, -- Use validation variable
    'authenticated', 
    'authenticated', 
    email, 
    encrypted_pw, 
    now(), 
    '{"provider": "email", "providers": ["email"]}', 
    json_build_object('role', user_role), 
    now(), 
    now()
  );

  -- 6. Create Identity (Using Pre-Gen ID)
  -- Explicitly casting to text to satisfy constraint
  INSERT INTO auth.identities (
    id, 
    user_id, 
    identity_data, 
    provider, 
    provider_id, 
    last_sign_in_at, 
    created_at, 
    updated_at
  ) VALUES (
    gen_random_uuid(), 
    new_user_id, 
    json_build_object('sub', new_user_id, 'email', email), 
    'email', 
    new_user_id::text, -- Cannot be null now
    NULL, 
    now(), 
    now()
  );

  -- 7. Create Profile (Safe Upsert)
  INSERT INTO public.profiles (id, role, credits, created_by, email, created_at)
  VALUES (new_user_id, user_role, user_credits, creator_id, email, now())
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    credits = EXCLUDED.credits,
    created_by = EXCLUDED.created_by,
    email = EXCLUDED.email;

  -- 8. Deduct Strategy
  IF caller_role = 'reseller' THEN
    UPDATE profiles 
    SET credits = credits - user_credits 
    WHERE id = auth.uid();
    
    IF (SELECT credits FROM profiles WHERE id = auth.uid()) < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente para asignar estos créditos.';
    END IF;
  END IF;

  RETURN new_user_id;
END;
$$;
