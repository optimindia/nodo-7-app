-- ==============================================
-- NUCLEAR CLEAN SLATE (Fix 500 Login Error)
-- ==============================================

-- 1. DROP EVERYTHING (Triggers & Functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_inserted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_created();

-- 2. DROP POLICIES (Reset Visibility)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;

-- 3. DROP HELPER FUNCTIONS (Potential crash source)
DROP FUNCTION IF EXISTS public.get_my_role();

-- 4. RE-ESTABLISH BASIC ACCESS (Emergency Mode)
-- Allow anyone authenticated to read/update their OWN profile (Basic Supabase Pattern)
CREATE POLICY "Emergency Self Access"
ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- 5. RE-GRANT BASIC PERMISSIONS
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;

-- NOTE: This removes complex role logic temporarily to restore LOGIN capability.
-- Once login works, we can re-apply strict Admin/Reseller Logic step-by-step.
