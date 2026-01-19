-- ==============================================
-- FIX: RLS RECURSION (Admin Panel Not Showing)
-- ==============================================

-- 1. Create SECURITY DEFINER functions to check roles without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
Stable
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reseller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
Stable
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'reseller'
  );
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Resellers view created profiles" ON public.profiles;

-- 3. Re-create policies using the safe functions

-- A. Admins can view ALL profiles
CREATE POLICY "Admins view all profiles" ON public.profiles 
FOR SELECT USING (
  public.is_admin()
);

-- B. Resellers can view profiles they CREATED, OR their own profile (already covered by "View own profile", but good to be explicit/safe)
CREATE POLICY "Resellers view created profiles" ON public.profiles 
FOR SELECT USING (
  public.is_reseller() AND created_by = auth.uid()
);

-- Note: "View own profile" policy created earlier handles the user seeing themselves.
