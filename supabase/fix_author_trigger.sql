-- ==============================================
-- FIX: AUTHOR ATTRIBUTION (Fixes "System" in Created By)
-- ==============================================

-- We update the trigger to look for 'created_by' in the metadata
-- sent during signUp.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, credits, subscription_status, created_by)
  VALUES (
    new.id, 
    new.email, 
    'client', -- Defaults to client (safety)
    0,        -- Defaults to 0 credits (safety)
    'active',
    -- Captures the author ID sent from Frontend!
    (new.raw_user_meta_data->>'created_by')::uuid 
  );
  
  -- Auto-confirm email
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
  
  RETURN new;
END;
$$;
