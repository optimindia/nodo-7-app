-- ==============================================
-- FIX: PERMISSIONS & RLS (DEFINITIVE v3)
-- ==============================================

-- 1. Reset
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;
DROP FUNCTION IF EXISTS get_my_role();

-- 2. Create Helper Function (SECURITY DEFINER + Explicit Schema)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Read directly from profiles bypassing RLS (due to security definer)
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- 3. GRANT EXECUTE (Check-mate)
GRANT EXECUTE ON FUNCTION public.get_my_role TO postgres;
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role TO anon;

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. User Self-View
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 6. Admin GLOBAL View
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING ( public.get_my_role() = 'admin' );

-- 7. Admin GLOBAL Update
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING ( public.get_my_role() = 'admin' );

-- 8. Reseller View
CREATE POLICY "Resellers can view their clients" 
ON public.profiles FOR SELECT 
USING ( created_by = auth.uid() OR id = auth.uid() );

-- 9. Reseller Update
CREATE POLICY "Resellers can update their clients" 
ON public.profiles FOR UPDATE 
USING ( created_by = auth.uid() );

-- 10. Grant Table Access
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;

-- Debug: check if it works for current user immediately
-- SELECT public.get_my_role(); 
