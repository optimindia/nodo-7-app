-- ==============================================================================
-- MASTER PROFILES SCHEMA V2.1 (FIX RECURSIÓN INFINITA)
-- ==============================================================================

-- 1. ESTRUCTURA (Idempotente)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'es',
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS has_completed_setup boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS role text DEFAULT 'client' CHECK (role IN ('admin', 'reseller', 'client')),
ADD COLUMN IF NOT EXISTS credits int DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. FUNCIÓN HELPER SEGURA (IMPORTANTE PARA EVITAR RECURSIÓN)
-- Esta función se salta las políticas para leer el rol, rompiendo el ciclo infinito.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 3. POLÍTICAS DE SEGURIDAD (RLS) - RESET TOTAL
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins All Access" ON profiles;
DROP POLICY IF EXISTS "Resellers View" ON profiles;
DROP POLICY IF EXISTS "Resellers Update" ON profiles;
DROP POLICY IF EXISTS "Users View Own" ON profiles;
DROP POLICY IF EXISTS "Users Update Own" ON profiles;
DROP POLICY IF EXISTS "Users Insert Own" ON profiles;

-- A) ADMINS: Usan la función segura
CREATE POLICY "Admins All Access" ON profiles FOR ALL 
USING (get_my_role() = 'admin');

-- B) REVENDEDORES: Usan la función segura
CREATE POLICY "Resellers View" ON profiles FOR SELECT 
USING (get_my_role() = 'reseller' AND (created_by = auth.uid() OR id = auth.uid()));

CREATE POLICY "Resellers Update" ON profiles FOR UPDATE 
USING (get_my_role() = 'reseller' AND created_by = auth.uid());

-- C) CLIENTES: Directo por ID (No causa recursión)
CREATE POLICY "Users View Own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users Update Own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users Insert Own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. FUNCIONES RPC (LOGICA DE NEGOCIO)
-- Reincluimos las funciones vitales para asegurar consistencia

CREATE OR REPLACE FUNCTION create_new_user(email text, password text, role_input text, credits_input int)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_user_id uuid; encrypted_pw text; caller_id uuid; caller_role text; caller_credits int;
BEGIN
  caller_id := auth.uid();
  SELECT role, credits INTO caller_role, caller_credits FROM profiles WHERE id = caller_id;

  -- Validaciones
  IF caller_role NOT IN ('admin', 'reseller') THEN RAISE EXCEPTION 'No tienes permisos.'; END IF;
  IF caller_role = 'reseller' THEN
     IF role_input != 'client' THEN RAISE EXCEPTION 'Solo puedes crear Clientes.'; END IF;
     IF caller_credits < 1 THEN RAISE EXCEPTION 'No tienes créditos suficientes.'; END IF;
  END IF;

  -- Auth
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf', 10));
  
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
  VALUES ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(), '{"provider": "email", "providers": ["email"]}', json_build_object('role', role_input), now(), now());

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at) 
  VALUES (gen_random_uuid(), new_user_id, json_build_object('sub', new_user_id, 'email', email), 'email', new_user_id::text, now(), now());

  -- Profile
  INSERT INTO public.profiles (id, email, role, credits, created_by, created_at, subscription_status, has_completed_setup) 
  VALUES (new_user_id, email, role_input, credits_input, caller_id, now(), 'active', false);

  -- Deduct Credit
  IF caller_role = 'reseller' THEN
     UPDATE profiles SET credits = credits - 1 WHERE id = caller_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuario creado correctamente.');
END;
$$;

CREATE OR REPLACE FUNCTION update_user_admin(target_user_id uuid, new_status text DEFAULT NULL, new_password text DEFAULT NULL, new_role text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_role text; target_creator uuid; encrypted_pw text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  IF caller_role = 'reseller' THEN
    SELECT created_by INTO target_creator FROM profiles WHERE id = target_user_id;
    IF target_creator != auth.uid() THEN RAISE EXCEPTION 'Solo puedes editar a tus clientes.'; END IF;
    IF new_role = 'admin' THEN RAISE EXCEPTION 'No puedes ascender usuarios a Admin.'; END IF;
  END IF;

  IF caller_role NOT IN ('admin', 'reseller') THEN RAISE EXCEPTION 'Permiso denegado.'; END IF;

  UPDATE profiles SET 
    subscription_status = COALESCE(new_status, subscription_status),
    role = COALESCE(new_role, role)
  WHERE id = target_user_id;

  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    UPDATE auth.users SET encrypted_password = encrypted_pw WHERE id = target_user_id;
  END IF;

  IF new_role IS NOT NULL THEN
    UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role) WHERE id = target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_users int; total_credits int; my_credits int; active_users int; resellers_count int;
  caller_id uuid; caller_role text;
BEGIN
  caller_id := auth.uid();
  SELECT role, credits INTO caller_role, my_credits FROM profiles WHERE id = caller_id;

  IF caller_role = 'admin' THEN
     SELECT count(*) INTO total_users FROM profiles;
     SELECT coalesce(sum(credits),0) INTO total_credits FROM profiles;
     SELECT count(*) INTO active_users FROM profiles WHERE subscription_status = 'active';
     SELECT count(*) INTO resellers_count FROM profiles WHERE role = 'reseller';
  ELSIF caller_role = 'reseller' THEN
     SELECT count(*) INTO total_users FROM profiles WHERE created_by = caller_id;
     SELECT coalesce(sum(credits),0) INTO total_credits FROM profiles WHERE created_by = caller_id;
     SELECT count(*) INTO active_users FROM profiles WHERE created_by = caller_id AND subscription_status = 'active';
     resellers_count := 0;
  ELSE
     RETURN json_build_object('error', 'Unauthorized');
  END IF;

  RETURN json_build_object('totalUsers', total_users, 'totalCredits', total_credits, 'myCredits', my_credits, 'activeUsers', active_users, 'resellers', resellers_count);
END;
$$;

CREATE OR REPLACE FUNCTION manage_credits(target_user_id uuid, amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_role text; caller_id uuid;
BEGIN
  caller_id := auth.uid();
  SELECT role INTO caller_role FROM profiles WHERE id = caller_id;

  IF caller_role = 'reseller' THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND created_by = caller_id) THEN RAISE EXCEPTION 'Solo tus clientes.'; END IF;
    IF amount > 0 THEN -- Giving
       IF (SELECT credits FROM profiles WHERE id = caller_id) < amount THEN RAISE EXCEPTION 'Saldo insuficiente.'; END IF;
       UPDATE profiles SET credits = credits - amount WHERE id = caller_id;
    ELSE -- Taking
       UPDATE profiles SET credits = credits - amount WHERE id = caller_id; 
    END IF;
  END IF;

  IF caller_role NOT IN ('admin', 'reseller') THEN RAISE EXCEPTION 'Sin permiso.'; END IF;

  UPDATE profiles SET credits = credits + amount WHERE id = target_user_id;
  IF (SELECT credits FROM profiles WHERE id = target_user_id) < 0 THEN RAISE EXCEPTION 'Saldo no puede ser negativo.'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delete_user_by_id(target_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Solo admin puede eliminar.');
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN json_build_object('success', true, 'message', 'Eliminado.');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
