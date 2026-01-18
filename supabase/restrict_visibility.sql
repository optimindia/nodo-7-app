-- ==============================================
-- STRICT VISIBILITY POLICY (HIERARCHY)
-- ==============================================

-- 1. Reset RLS on Profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Admin All Access" ON public.profiles;
DROP POLICY IF EXISTS "Self Access" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create STRICT Policy
-- Admin: Sees Everything
-- Reseller/Client: Sees Self AND Users they created (created_by = auth.uid())

CREATE POLICY "Strict Hierarchy Visibility" ON public.profiles
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' -- Admin sees all
  OR 
  id = auth.uid() -- I see myself
  OR 
  created_by = auth.uid() -- I see my creations (Active Customers)
);

-- 3. Allow Update (Admins & Resellers on their flock)
CREATE POLICY "Hierarchy Management" ON public.profiles
FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR 
  created_by = auth.uid()
);

-- 4. Allow Insert (handled by RPC usually, but good to have)
CREATE POLICY "Self Insert" ON public.profiles
FOR INSERT
WITH CHECK (
  id = auth.uid()
);
