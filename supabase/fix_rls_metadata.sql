-- ==============================================
-- FIX: SYNC METADATA & NON-RECURSIVE RLS
-- ==============================================

-- 1. SYNC: Update auth.users metadata from profiles table
-- This takes the role you set in the table and puts it in the secure Auth Metadata.
UPDATE auth.users u
SET raw_user_meta_data = 
  COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id;

-- 2. DROP OLD POLICIES (Cleaning up)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;
-- Keep "Users can view own profile" as it is simple and safe

-- 3. CREATE NEW RECURSION-PROOF POLICIES (Using JWT Metadata)
-- These look at your Login Token (faster, safer, no recursion)

-- ADMIN VIEW ALL
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- ADMIN UPDATE ALL
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- RESELLER VIEW
CREATE POLICY "Resellers can view their clients" 
ON public.profiles FOR SELECT 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'reseller' 
  AND 
  (created_by = auth.uid() OR id = auth.uid()) 
);

-- RESELLER UPDATE
CREATE POLICY "Resellers can update their clients" 
ON public.profiles FOR UPDATE 
USING ( 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'reseller' 
  AND 
  created_by = auth.uid() 
);
