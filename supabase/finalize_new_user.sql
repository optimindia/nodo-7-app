-- ==============================================
-- FINALIZE USER SETUP (Post-SignUp RPC)
-- ==============================================

CREATE OR REPLACE FUNCTION finalize_new_user(
    target_user_id uuid,
    target_role text,
    target_credits int,
    creator_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  caller_credits int;
BEGIN
  -- 1. Identify Caller
  SELECT role, credits INTO caller_role, caller_credits FROM profiles WHERE id = auth.uid();

  -- 2. Permission Check
  IF caller_role NOT IN ('admin', 'reseller') THEN
    RAISE EXCEPTION 'Acceso Denegado.';
  END IF;

  IF caller_role = 'reseller' AND target_role = 'admin' THEN
    RAISE EXCEPTION 'Los revendedores no pueden crear administradores.';
  END IF;

  -- 3. Deduct Credits (if Reseller)
  IF caller_role = 'reseller' THEN
    IF caller_credits < target_credits THEN
        RAISE EXCEPTION 'Saldo insuficiente.';
    END IF;
    
    UPDATE profiles 
    SET credits = credits - target_credits 
    WHERE id = auth.uid();
  END IF;

  -- 4. FORCE CONFIRM EMAIL (Critical for Login)
  -- This makes the user immediately usable without email click
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE id = target_user_id;

  -- 5. Create/Update Profile
  -- We use UPSERT in case the trigger (if exists) or signUp partially created it
  INSERT INTO public.profiles (id, email, role, credits, created_by, created_at, subscription_status)
  VALUES (
      target_user_id, 
      (SELECT email FROM auth.users WHERE id = target_user_id), 
      target_role, 
      target_credits, 
      creator_id, 
      now(),
      'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    credits = EXCLUDED.credits,
    created_by = EXCLUDED.created_by,
    subscription_status = 'active';

  RETURN json_build_object('success', true);
END;
$$;
