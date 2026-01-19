-- =================================================================
-- RESTORE STANDARD SUPABASE AUTH (GOLDEN SCRIPT)
-- This script resets the Auth architecture to the standard recommended pattern.
-- It fixes the 500 error by ensuring a clean, non-recursive Trigger for Profile creation.
-- =================================================================

-- 1. CLEANUP (Drop potentially conflicting custom logic)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop Custom Auth RPCs (to force us to usage standard auth)
DROP FUNCTION IF EXISTS public.create_new_user(text, text, text, int, uuid);
DROP FUNCTION IF EXISTS public.verify_user_custom(text, text);

-- 2. ROBUST USER CREATION FUNCTION
-- This function runs with Security Definer to bypass RLS during profile creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, credits, subscription_status)
  VALUES (
    new.id,
    new.email,
    'client', -- Default role, can be updated later
    0,        -- Default credits
    'active'  -- Default status
  );
  RETURN new;
END;
$$;

-- 3. RE-ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS POLICIES (Reset to Standard)
-- Ensure users can read/update their own profile.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Note: We generally don't allow users to update their own role/credits, so we restrict UPDATE
-- to specific columns if needed, but for now allow full update on own row for simplicity,
-- usually you'd verify role logic in a separate function or column-level privilege.
-- For this app, we might restrict UPDATE to Admins, but let's allow read.

-- ALLOW insert (Trigger does it, but sometimes needed if trigger fails and client retires? No, trigger is server side)
-- Generally, we DON'T need an INSERT policy for authenticated users if the Trigger does it as 'security definer'.

-- 5. PERMISSIONS FIX
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wallets TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.goals TO anon, authenticated, service_role;
-- We need to ensure that the previously created "Secure RPCs" don't block standard access if we remove them?
-- Actually, we can keep the Secure RPCs as "Admin Tools" if we want, but let's rely on standard access for the Frontend.

-- 6. RESET WALLET RLS (Standard)
DROP POLICY IF EXISTS "Users can delete own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;

CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- 7. RESET TRANSACTION RLS (Standard)
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 8. RESET GOAL RLS (Standard)
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

