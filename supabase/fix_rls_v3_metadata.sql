-- ==============================================================================
-- FIX RLS V3: ESTRATEGIA METADATA (0 RECURSIÓN)
-- Solución definitiva al error 500 "infinite recursion".
-- ==============================================================================

-- 1. SINCRONIZACIÓN PREVIA (Vital para que funcione el nuevo RLS)
-- Copiamos el 'role' de la tabla profiles a raw_user_meta_data de auth.users
-- Esto asegura que auth.jwt() tenga el dato correcto.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM profiles LOOP
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', r.role)
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 2. LIMPIEZA TOTAL DE POLÍTICAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins All Access" ON profiles;
DROP POLICY IF EXISTS "Resellers View" ON profiles;
DROP POLICY IF EXISTS "Resellers Update" ON profiles;
DROP POLICY IF EXISTS "Users View Own" ON profiles;
DROP POLICY IF EXISTS "Users Update Own" ON profiles;
DROP POLICY IF EXISTS "Users Insert Own" ON profiles;
DROP FUNCTION IF EXISTS get_my_role(); -- Ya no es necesaria y es peligrosa

-- 3. NUEVAS POLÍTICAS "ZERO-RECURSION"
-- Usamos (auth.jwt() -> 'user_metadata' ->> 'role') que lee del TOKEN, no de la tabla.

-- A) ADMINS: Si en su metadata dice 'admin', entra.
CREATE POLICY "Admins All Access" ON profiles FOR ALL 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- B) REVENDEDORES: Si en su metadata dice 'reseller', ve sus clientes.
CREATE POLICY "Resellers View" ON profiles FOR SELECT 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'reseller' 
  AND (created_by = auth.uid() OR id = auth.uid())
);

CREATE POLICY "Resellers Update" ON profiles FOR UPDATE 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'reseller' 
  AND created_by = auth.uid()
);

-- C) CLIENTES: Regla estándar por ID
CREATE POLICY "Users View Own" ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users Update Own" ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users Insert Own" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. ACTUALIZAR TRIGGERS/FUNCIONES PARA MANTENER SINCRONÍA
-- Aseguramos que si alguien cambia el rol en profiles, se actualice en auth.users

CREATE OR REPLACE FUNCTION sync_role_to_metadata()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();

-- 5. RE-VERIFICAR RPCs (Por seguridad, las volvemos a definir idénticas pero sin cambios lógicos)
-- Solo master_profiles_schema.sql V2.1 ya las tenía bien, así que no es estrictamente necesario repetirlas 
-- si ya se corrió el V2.1, pero el trigger anterior cubre la sincronización automática.
