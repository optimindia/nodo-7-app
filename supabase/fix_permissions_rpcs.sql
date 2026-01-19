-- ==============================================
-- FORCE PERMISSIONS FIX (CRITICAL)
-- The "Function not found" error often happens because
-- the 'authenticated' (or 'anon') role doesn't have permission to RUN the function.
-- ==============================================

-- 1. Grant Usage on Schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Execute on ALL Secure RPCs
GRANT EXECUTE ON FUNCTION public.create_wallet_secure(uuid, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_wallet_secure(uuid, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_wallet_secure(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_wallets_secure(uuid) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_transaction_secure(uuid, uuid, numeric, text, text, text, timestamp with time zone) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_transaction_secure(uuid, numeric, text, text, text, timestamp with time zone, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_transaction_secure(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_transactions_secure(uuid) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.update_goal_amount_secure(uuid, numeric) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_secure(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_goals_secure(uuid) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_admin_stats_secure(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_new_user(text, text, text, int, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_user_custom(text, text) TO anon, authenticated, service_role;


-- 3. Verify Function Existence (Diagnostic)
-- Use this query to check if they exist:
-- SELECT rutine_name FROM information_schema.routines WHERE routine_schema = 'public';
