-- ==============================================
-- SECURE DASHBOARD DATA RPCs
-- ==============================================

-- 1. Get Profile Secure
CREATE OR REPLACE FUNCTION get_profile_secure(p_user_id uuid)
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.profiles WHERE id = p_user_id;
$$;

-- 2. Get Transactions Secure
CREATE OR REPLACE FUNCTION get_transactions_secure(p_user_id uuid)
RETURNS SETOF public.transactions
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.transactions 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC;
$$;

-- 3. Get Goals Secure
CREATE OR REPLACE FUNCTION get_goals_secure(p_user_id uuid)
RETURNS SETOF public.goals
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.goals WHERE user_id = p_user_id;
$$;
