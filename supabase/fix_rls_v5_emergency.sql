-- ==============================================================================
-- FIX RLS V5: RECUPERACIÓN DE EMERGENCIA & SIMPLIFICACIÓN
-- Objetivo:
-- 1. Que vuelvas a ver tu rol (Lectura propia inmediata).
-- 2. Que funcione el Admin (Funciones aisladas anti-recursión).
-- ==============================================================================

-- 1. LIMPIEZA TOTAL (Borrar políticas y funciones previas de intentos fallidos)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; -- Desactivar momentáneamente para evitar bloqueos durante el script
DROP POLICY IF EXISTS "Admins All Access" ON profiles;
DROP POLICY IF EXISTS "Resellers View" ON profiles;
DROP POLICY IF EXISTS "Resellers Update" ON profiles;
DROP POLICY IF EXISTS "Users View Own" ON profiles;
DROP POLICY IF EXISTS "Users Update Own" ON profiles;
DROP POLICY IF EXISTS "Users Insert Own" ON profiles;
-- Borrar funciones helpers anteriores si existen
DROP FUNCTION IF EXISTS get_my_role(); 
DROP FUNCTION IF EXISTS sync_role_to_metadata();
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;

-- 2. FUNCIONES DE SEGURIDAD AISLADAS (SECURITY DEFINER)
-- Estas funciones se ejecutan con permisos de "Superusuario" del script,
-- saltándose el RLS de la tabla, lo que garantiza 0 recursión.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public -- Seguridad: Definir search_path
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

-- 3. NUEVAS POLÍTICAS (SIMPLIFICADAS)

-- A) REGLA DE ORO DE LECTURA: Cada usuario SIEMPRE puede ver su propio perfil.
-- Esto arregla el "No aparece mi rol". Es simple y directo.
CREATE POLICY "Allow Self Read"
ON profiles FOR SELECT
USING ( auth.uid() = id );

-- B) REGLA DE ESCRITURA PROPIA: Cada usuario puede editar sus datos.
CREATE POLICY "Allow Self Update"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- C) ADMINS: Usan la función is_admin() que es segura.
-- 'ALL' permite Select, Insert, Update, Delete sobre TODOS los registros.
CREATE POLICY "Allow Admin Full Access"
ON profiles FOR ALL
USING ( is_admin() );

-- D) REVENDEDORES: Usan la función is_reseller() y ven a sus clientes.
-- Select y Update sobre sus 'creaciones'.
CREATE POLICY "Allow Reseller Read Clients"
ON profiles FOR SELECT
USING ( is_reseller() AND created_by = auth.uid() );

CREATE POLICY "Allow Reseller Update Clients"
ON profiles FOR UPDATE
USING ( is_reseller() AND created_by = auth.uid() );

-- 4. REACTIVAR SEGURIDAD
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. GRANT EXECUTE (Asegurar que los usuarios pueden llamar a las funciones validadoras)
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reseller TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id TO authenticated;

-- LISTO.
