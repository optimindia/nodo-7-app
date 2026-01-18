-- ==============================================
-- FIX: ADD MISSING 'created_at' COLUMN
-- ==============================================

-- 1. Add created_at column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Backfill created_at from auth.users (To have real join dates)
-- This creates a seamless "Joined At" history
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id;

-- 3. (Optional) Enable RLS again if it was disabled
-- Ideally we want RLS enabled for security, but with the correct fix it works.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
