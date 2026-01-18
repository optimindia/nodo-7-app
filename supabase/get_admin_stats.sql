-- ==============================================
-- DASHBOARD STATS RPC (Optimized)
-- ==============================================
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  caller_id uuid;
  result json;
  
  -- Stats placeholders
  total_users_count int;
  total_credits_sum int;
  active_users_count int;
  resellers_count int;
  available_credits int;
BEGIN
  caller_id := auth.uid();
  SELECT role, credits INTO caller_role, available_credits FROM profiles WHERE id = caller_id;

  -- 1. Determine Scope & Aggregate
  IF caller_role = 'admin' THEN
    -- Admin sees GLOBAL stats
    SELECT count(*), coalesce(sum(credits), 0) INTO total_users_count, total_credits_sum FROM profiles;
    SELECT count(*) INTO active_users_count FROM profiles WHERE subscription_status = 'active';
    SELECT count(*) INTO resellers_count FROM profiles WHERE role = 'reseller';
    
    result := json_build_object(
      'totalUsers', total_users_count,
      'totalCredits', total_credits_sum,
      'myCredits', available_credits, -- Admin can also have personal credits
      'activeUsers', active_users_count,
      'resellers', resellers_count
    );

  ELSIF caller_role = 'reseller' THEN
    -- Reseller sees THEIR ecosystem (themselves + their creations)
    -- Total Users = Their Clients (created_by = me)
    SELECT count(*) INTO total_users_count FROM profiles WHERE created_by = caller_id;
    
    -- Total Credits Circulating (in their clients)
    SELECT coalesce(sum(credits), 0) INTO total_credits_sum FROM profiles WHERE created_by = caller_id;
    
    -- Active Users (My clients)
    SELECT count(*) INTO active_users_count FROM profiles WHERE created_by = caller_id AND subscription_status = 'active';
    
    -- Resellers (In my downline - maybe future proofing, currently flat hierarchy)
    SELECT count(*) INTO resellers_count FROM profiles WHERE created_by = caller_id AND role = 'reseller';

    result := json_build_object(
      'totalUsers', total_users_count,
      'totalCredits', total_credits_sum, -- Credits assigned to clients
      'myCredits', available_credits,    -- My Stock
      'activeUsers', active_users_count,
      'resellers', resellers_count
    );
    
  ELSE
    RAISE EXCEPTION 'Acceso denegado a estadísticas.';
  END IF;

  RETURN result;
END;
$$;
