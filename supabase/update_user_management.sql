-- ==============================================
-- GESTIÓN DE USUARIOS Y RLS (OPTIMIZADO)
-- ==============================================

-- 1. ASEGURAR COLUMNA 'created_by'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. REFORZAR POLÍTICAS RLS (Seguridad)
-- Primero, desactivamos las políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Habilitar RLS explícitamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política ADMIN: Ver y Editar TODO
CREATE POLICY "Admins can do everything" 
ON profiles FOR ALL 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Política REVENDEDOR: Ver solo sus clientes o a sí mismo
CREATE POLICY "Resellers view own clients" 
ON profiles FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'reseller' 
  AND (
    created_by = auth.uid() -- Sus clientes
    OR id = auth.uid()      -- Él mismo
  )
);

-- Política CLIENTE: Ver solo su propio perfil
CREATE POLICY "Clients view own profile" 
ON profiles FOR SELECT 
USING (
  auth.uid() = id
);

-- 3. FUNCIÓN RPC SEGURA PARA CREAR USUARIOS
-- Esta función reemplaza la lógica del frontend. Crea Auth + Perfil atómicamente.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION create_new_user(
    email text,
    password text,
    role_input text,
    credits_input int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos de superusuario para insertar en auth.users
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
  caller_id uuid;
  caller_role text;
  caller_credits int;
BEGIN
  caller_id := auth.uid();

  -- Obtener datos del creador
  SELECT role, credits INTO caller_role, caller_credits 
  FROM profiles WHERE id = caller_id;

  -- VALIDACIONES DE PERMISOS
  IF caller_role IS NULL THEN
     RAISE EXCEPTION 'Usuario no autenticado.';
  END IF;

  IF caller_role NOT IN ('admin', 'reseller') THEN
     RAISE EXCEPTION 'No tienes permisos para crear usuarios.';
  END IF;

  -- VALIDACIONES ESPECÍFICAS DE REVENDEDOR
  IF caller_role = 'reseller' THEN
     IF role_input != 'client' THEN
        RAISE EXCEPTION 'Los revendedores solo pueden crear Clientes.';
     END IF;
     
     IF caller_credits < 1 THEN -- Asumimos costo de 1 crédito por creación, o usar lógica custom
        RAISE EXCEPTION 'No tienes créditos suficientes.';
     END IF;
  END IF;

  -- GENERAR ID Y HASH
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf', 10));

  -- 1. INSERTAR EN AUTH.USERS
  -- Nota: Esto simula un signUp manual insertando directamente en la tabla interna de Supabase
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
    new_user_id, 
    'authenticated', 
    'authenticated', 
    email, 
    encrypted_pw, 
    now(), 
    '{"provider": "email", "providers": ["email"]}', 
    json_build_object('role', role_input), 
    now(), 
    now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    new_user_id, 
    json_build_object('sub', new_user_id, 'email', email), 
    'email', 
    new_user_id::text, 
    now(), 
    now()
  );

  -- 2. INSERTAR EN PUBLIC.PROFILES
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    credits, 
    created_by, 
    created_at, 
    subscription_status
  ) VALUES (
    new_user_id, 
    email, 
    role_input, 
    credits_input, 
    caller_id, -- AQUÍ SE GUARDA QUIEN LO CREÓ
    now(),
    'active'
  );

  -- 3. DEDUCIR CRÉDITOS (Si es revendedor)
  -- Nota: Solo restamos 1 crédito por creación si esa es la regla. 
  -- Si 'credits_input' es lo que se le da al usuario, el costo al revendedor podría ser aparte.
  -- Asumiremos que crear un cliente cuesta 1 crédito al revendedor.
  IF caller_role = 'reseller' THEN
     UPDATE profiles 
     SET credits = credits - 1 
     WHERE id = caller_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'user_id', new_user_id,
    'message', 'Usuario creado correctamente.'
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback no explícito necesario, PG lo hace automático en excepciones
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
