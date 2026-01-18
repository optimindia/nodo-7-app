-- ==============================================
-- CREDIT MANAGEMENT SYSTEM (RPC)
-- ==============================================

CREATE OR REPLACE FUNCTION manage_credits(
    target_user_id uuid,
    amount int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  target_creator uuid;
BEGIN
  -- 1. Identify Caller
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- 2. Permission Logic
  IF caller_role = 'admin' THEN
    -- Admin: God Mode (Generate/Destroy credits)
    UPDATE profiles 
    SET credits = credits + amount 
    WHERE id = target_user_id;

  ELSIF caller_role = 'reseller' THEN
    -- Reseller: Transfer Mode (My Pocket -> Client Pocket)
    
    -- Verify Target is MY client
    SELECT created_by INTO target_creator FROM profiles WHERE id = target_user_id;
    
    IF target_creator != auth.uid() THEN
        RAISE EXCEPTION 'Acceso Denegado: Solo puedes gestionar a tus propios clientes.';
    END IF;

    -- Transaction Logic
    -- Deduct from Reseller
    UPDATE profiles 
    SET credits = credits - amount 
    WHERE id = auth.uid();

    -- Check Reseller Solvency
    IF (SELECT credits FROM profiles WHERE id = auth.uid()) < 0 THEN
       RAISE EXCEPTION 'No tienes suficientes créditos para realizar esta recarga.';
    END IF;

    -- Add to Client
    UPDATE profiles 
    SET credits = credits + amount 
    WHERE id = target_user_id;

  ELSE
    RAISE EXCEPTION 'Acceso Denegado.';
  END IF;

END;
$$;
