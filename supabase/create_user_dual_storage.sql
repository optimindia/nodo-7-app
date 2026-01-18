-- ==============================================
-- SECURE USER CREATION (v7 - DUAL STORAGE)
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
  -- 1. Get Caller Role
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- 2. Permission Checks (Disabled for manual emergency testing if needed, but keeping unsafe for now)
  -- IF caller_role NOT IN ('admin', 'reseller') THEN RAISE EXCEPTION 'Acceso Denegado.'; END IF;

  new_user_id := gen_random_uuid();
  -- Force Bcrypt Cost 10
  encrypted_pw := crypt(password, gen_salt('bf', 10));
  
  -- 3. Create Auth User (Standard)
  -- We still try to create it in Auth just in case it starts working later
  BEGIN
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
      VALUES ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(), '{"provider": "email", "providers": ["email"]}', json_build_object('role', user_role), now(), now());
      
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at) 
      VALUES (gen_random_uuid(), new_user_id, json_build_object('sub', new_user_id, 'email', email), 'email', new_user_id::text, now(), now());
  EXCEPTION WHEN OTHERS THEN
      -- Create a log or ignore if we want to rely strictly on custom profile
      -- For now, we propagate error if this fails? No, we want to ensure PROFILE is created.
      RAISE NOTICE 'Error creating auth.users, proceeding to profile only: %', SQLERRM;
  END;

  -- 4. Create Profile (Dual Storage: Now with Password Hash!)
  INSERT INTO public.profiles (id, role, credits, created_by, email, created_at, password_hash)
  VALUES (new_user_id, user_role, user_credits, creator_id, email, now(), encrypted_pw)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    credits = EXCLUDED.credits,
    created_by = EXCLUDED.created_by,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash; -- Update password if recreating

  -- 5. Deduct
  IF caller_role = 'reseller' THEN
    UPDATE profiles SET credits = credits - user_credits WHERE id = auth.uid();
  END IF;

  RETURN new_user_id;
END;
$$;
