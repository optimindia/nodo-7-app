-- =================================================================
-- MASTER SECURE RPC SETUP (CUSTOM AUTH ENABLED)
-- This script installs ALL necessary functions for the app to work 
-- without standard Supabase Auth sessions.
-- =================================================================

-- 1. WALLET RPCs
CREATE OR REPLACE FUNCTION create_wallet_secure(p_user_id uuid, p_name text, p_type text, p_color text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_wallet_id uuid;
BEGIN
    INSERT INTO public.wallets (user_id, name, type, color) VALUES (p_user_id, p_name, p_type, p_color) RETURNING id INTO new_wallet_id;
    RETURN json_build_object('success', true, 'id', new_wallet_id);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION update_wallet_secure(p_wallet_id uuid, p_name text, p_type text, p_color text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.wallets SET name = p_name, type = p_type, color = p_color WHERE id = p_wallet_id; RETURN json_build_object('success', true); END; $$;

CREATE OR REPLACE FUNCTION delete_wallet_secure(p_wallet_id uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM public.wallets WHERE id = p_wallet_id; RETURN json_build_object('success', true); END; $$;

CREATE OR REPLACE FUNCTION get_wallets_secure(p_user_id uuid) RETURNS SETOF public.wallets LANGUAGE sql SECURITY DEFINER AS $$
    SELECT * FROM public.wallets WHERE user_id = p_user_id ORDER BY created_at ASC; $$;

-- 2. TRANSACTION RPCS
CREATE OR REPLACE FUNCTION create_transaction_secure(p_user_id uuid, p_wallet_id uuid, p_amount numeric, p_type text, p_description text, p_category text, p_date timestamp with time zone) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_tx_id uuid;
BEGIN
    INSERT INTO public.transactions (user_id, wallet_id, amount, type, description, category, date, created_at) VALUES (p_user_id, p_wallet_id, p_amount, p_type, p_description, p_category, p_date, now()) RETURNING id INTO new_tx_id;
    RETURN json_build_object('success', true, 'id', new_tx_id);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION update_transaction_secure(p_tx_id uuid, p_amount numeric, p_type text, p_description text, p_category text, p_date timestamp with time zone, p_wallet_id uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.transactions SET amount = p_amount, type = p_type, description = p_description, category = p_category, date = p_date, wallet_id = p_wallet_id WHERE id = p_tx_id; RETURN json_build_object('success', true); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION delete_transaction_secure(p_tx_id uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM public.transactions WHERE id = p_tx_id; RETURN json_build_object('success', true); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION get_transactions_secure(p_user_id uuid) RETURNS SETOF public.transactions LANGUAGE sql SECURITY DEFINER AS $$ 
    SELECT * FROM public.transactions WHERE user_id = p_user_id ORDER BY created_at DESC; $$;

-- 3. GOAL & DASHBOARD RPCs
CREATE OR REPLACE FUNCTION update_goal_amount_secure(p_goal_id uuid, p_current_amount numeric) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN UPDATE public.goals SET current_amount = p_current_amount WHERE id = p_goal_id; RETURN json_build_object('success', true); EXCEPTION WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION get_profile_secure(p_user_id uuid) RETURNS SETOF public.profiles LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.profiles WHERE id = p_user_id; $$;
CREATE OR REPLACE FUNCTION get_goals_secure(p_user_id uuid) RETURNS SETOF public.goals LANGUAGE sql SECURITY DEFINER AS $$ SELECT * FROM public.goals WHERE user_id = p_user_id; $$;

-- 4. ADMIN & RESELLER STATS (SECURE)
CREATE OR REPLACE FUNCTION get_admin_stats_secure(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  caller_id uuid;
  result json;
  total_users_count int;
  total_credits_sum int;
  active_users_count int;
  resellers_count int;
  available_credits int;
BEGIN
  caller_id := p_user_id; -- Use passed ID instead of auth.uid()
  SELECT role, credits INTO caller_role, available_credits FROM profiles WHERE id = caller_id;

  IF caller_role = 'admin' THEN
    SELECT count(*), coalesce(sum(credits), 0) INTO total_users_count, total_credits_sum FROM profiles;
    SELECT count(*) INTO active_users_count FROM profiles WHERE subscription_status = 'active';
    SELECT count(*) INTO resellers_count FROM profiles WHERE role = 'reseller';
    
    result := json_build_object(
      'totalUsers', total_users_count,
      'totalCredits', total_credits_sum,
      'myCredits', available_credits,
      'activeUsers', active_users_count,
      'resellers', resellers_count
    );

  ELSIF caller_role = 'reseller' THEN
    SELECT count(*) INTO total_users_count FROM profiles WHERE created_by = caller_id;
    SELECT coalesce(sum(credits), 0) INTO total_credits_sum FROM profiles WHERE created_by = caller_id;
    SELECT count(*) INTO active_users_count FROM profiles WHERE created_by = caller_id AND subscription_status = 'active';
    SELECT count(*) INTO resellers_count FROM profiles WHERE created_by = caller_id AND role = 'reseller';

    result := json_build_object(
      'totalUsers', total_users_count,
      'totalCredits', total_credits_sum, 
      'myCredits', available_credits,    
      'activeUsers', active_users_count,
      'resellers', resellers_count
    );
    
  ELSE
    result := json_build_object('error', 'Acceso denegado');
  END IF;

  RETURN result;
END;
$$;
