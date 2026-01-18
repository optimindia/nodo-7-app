-- ==============================================
-- UPDATE USER DETAILS RPC
-- ==============================================

CREATE OR REPLACE FUNCTION update_user_admin(
    target_user_id uuid,
    new_status text, -- 'active', 'inactive', 'trial'
    new_password text DEFAULT NULL,
    new_role text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  target_creator uuid;
  encrypted_pw text;
BEGIN
  -- 1. Identify Caller
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- 2. Validate Target Ownership
  IF caller_role = 'reseller' THEN
    SELECT created_by INTO target_creator FROM profiles WHERE id = target_user_id;
    IF target_creator != auth.uid() THEN
        RAISE EXCEPTION 'Solo puedes editar a tus clientes.';
    END IF;
    
    -- Reseller cannot change ROLE to Admin
    IF new_role = 'admin' THEN
        RAISE EXCEPTION 'No puedes ascender usuarios a Admin.';
    END IF;
  END IF;

  IF caller_role NOT IN ('admin', 'reseller') THEN
    RAISE EXCEPTION 'Permiso denegado.';
  END IF;

  -- 3. Update Profile Status & Role
  UPDATE profiles 
  SET 
    subscription_status = COALESCE(new_status, subscription_status),
    role = COALESCE(new_role, role)
  WHERE id = target_user_id;

  -- 4. Update Password (if provided)
  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    
    UPDATE auth.users 
    SET encrypted_password = encrypted_pw 
    WHERE id = target_user_id;
  END IF;

  -- 5. Sync Metadata (Important for RLS!)
  -- If role changed, update Auth Metadata too
  IF new_role IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', new_role)
    WHERE id = target_user_id;
  END IF;

END;
$$;
