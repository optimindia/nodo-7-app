-- ==============================================
-- FIX: ADD EMAIL COLUMN TO PROFILES
-- ==============================================

-- 1. Add email column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill email addresses from auth.users (This works if run in SQL Editor as postgres)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- 3. (Optional) Create a trigger to keep email in sync on update? 
-- For MVP, the insert in our RPC handles new users. 
-- The trigger handling 'on auth.users insert' (handle_new_user) usually does this too.
-- Let's update that generic trigger if it exists, or just rely on our RPC for now.

-- ==============================================
-- RE-APPLY RPC (Safe to run again)
-- ==============================================
-- Just to be absolutely sure the function definition is using the column.
