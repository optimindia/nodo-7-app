-- ==============================================
-- FIX: ROBUST RLS POLICIES (FINAL)
-- ==============================================

-- 1. Reset everything to be clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;
DROP FUNCTION IF EXISTS get_my_role();

-- 2. Create Helper Function (SECURITY DEFINER with Search Path is key)
-- This function runs as the database owner, bypassing RLS.
-- We fix search_path to prevent hijacking.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 3. Enable RLS (Just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CRITICAL: "Users can view own profile"
-- Everyone needs this to load the app initially.
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 5. ADMIN POLICY
-- Use the secure function. Admin sees ALL rows.
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (get_my_role() = 'admin');

-- 6. ADMIN UPDATE POLICY
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (get_my_role() = 'admin');

-- 7. RESELLER POLICY
-- See own + created_by me
CREATE POLICY "Resellers can view their clients" 
ON profiles FOR SELECT 
USING (
  created_by = auth.uid() 
  OR 
  id = auth.uid()
);

-- 8. RESELLER UPDATE POLICY
CREATE POLICY "Resellers can update their clients" 
ON profiles FOR UPDATE 
USING (
  created_by = auth.uid()
);

-- 9. USER UPDATE POLICY
-- Users can only update themselves
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 10. Grant permissions just in case
GRANT SELECT, UPDATE, INSERT ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
