-- ==============================================
-- EMERGENCY SECURITY FIX: VISIBILITY
-- ==============================================

-- 1. Force RLS to be ON
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. NUCLEAR OPTION: Drop ALL existing policies to prevent "OR" leaks
-- We list common names we might have used. If you have others, they must be dropped too.
DROP POLICY IF EXISTS "Public Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Admin All Access" ON public.profiles;
DROP POLICY IF EXISTS "Self Access" ON public.profiles;
DROP POLICY IF EXISTS "Strict Hierarchy Visibility" ON public.profiles;
DROP POLICY IF EXISTS "See own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- 3. Create the ONE TRUE POLICY (Strict Hierarchy)
-- Logic:
-- A. I am Admin? -> See ALL.
-- B. It is MY profile? -> See IT.
-- C. I created this profile? -> See IT.

CREATE POLICY "Strict_Hierarchy_V2" ON public.profiles
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' -- Global View for Admin
  OR 
  id = auth.uid() -- See Myself
  OR 
  created_by = auth.uid() -- See My Direct Children
);

-- 4. Management Policies (Update)
DROP POLICY IF EXISTS "Hierarchy Management" ON public.profiles;

CREATE POLICY "Hierarchy_Management_V2" ON public.profiles
FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR 
  created_by = auth.uid()
);
