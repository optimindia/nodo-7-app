-- ==============================================
-- REMOVE GHOST TRIGGERS (Fix 500 Schema Error)
-- ==============================================

-- 1. Drop the standard Supabase Starter Trigger if it exists
-- This trigger often tries to insert into 'profiles' automatically,
-- conflicting with our 'create_new_user' RPC and causing duplicate/schema errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function associated with the trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Also check for any other common triggers on auth.users
-- Sometimes named 'on_auth_user_inserted'
DROP TRIGGER IF EXISTS on_auth_user_inserted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_created();

-- 4. Verify RLS availability
-- Just to be safe, RE-ENABLE RLS on profiles to ensure no weird state
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
