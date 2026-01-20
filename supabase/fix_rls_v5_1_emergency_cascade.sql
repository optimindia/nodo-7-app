-- ==============================================================================
-- FIX RLS V5.1: RECUPERACIÓN CON CASCADE
-- Solución al error "cannot drop function... because other objects depend on it"
-- ==============================================================================

-- 1. LIMPIEZA TOTAL AGRESIVA (Con CASCADE)
-- CASCADE borrará automáticamente los triggers o vistas que dependan de estas funciones.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins All Access" ON profiles;
DROP POLICY IF EXISTS "Resellers View" ON profiles;
DROP POLICY IF EXISTS "Resellers Update" ON profiles;
DROP POLICY IF EXISTS "Users View Own" ON profiles;
DROP POLICY IF EXISTS "Users Update Own" ON profiles;
DROP POLICY IF EXISTS "Users Insert Own" ON profiles;
DROP POLICY IF EXISTS "Allow Self Read" ON profiles;
DROP POLICY IF EXISTS "Allow Self Update" ON profiles;
DROP POLICY IF EXISTS "Allow Admin Full Access" ON profiles;
DROP POLICY IF EXISTS "Allow Reseller Read Clients" ON profiles;
DROP POLICY IF EXISTS "Allow Reseller Update Clients" ON profiles;

-- Limpieza de funciones y triggers conflictivos
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
DROP FUNCTION IF EXISTS sync_role_to_metadata() CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;

-- 2. FUNCIONES DE SEGURIDAD AISLADAS (SECURITY DEFINER)
-- Copiadas del V5 (que eran correctas, solo falló la limpieza)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reseller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'reseller'
  );
$$;

-- 3. NUEVAS POLÍTICAS (SIMPLIFICADAS V5)

-- A) REGLA DE ORO DE LECTURA (Usuario ve su row)
CREATE POLICY "Allow Self Read"
ON profiles FOR SELECT
USING ( auth.uid() = id );

-- B) REGLA DE ESCRITURA PROPIA
CREATE POLICY "Allow Self Update"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- C) ADMINS (Usa función aislada)
CREATE POLICY "Allow Admin Full Access"
ON profiles FOR ALL
USING ( is_admin() );

-- D) REVENDEDORES (Usa función aislada)
CREATE POLICY "Allow Reseller Read Clients"
ON profiles FOR SELECT
USING ( is_reseller() AND created_by = auth.uid() );

CREATE POLICY "Allow Reseller Update Clients"
ON profiles FOR UPDATE
USING ( is_reseller() AND created_by = auth.uid() );

-- 4. REACTIVAR SEGURIDAD
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. GRANT EXECUTE (Permisos)
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reseller TO authenticated;
-- (Las otras RPC ya existen del V2.1/V3, no es necesario recrearlas aquí, solo las políticas bloqueaban)

-- LISTO.
