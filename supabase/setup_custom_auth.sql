-- ==============================================
-- CUSTOM AUTH SETUP (The "MacGyver" Fix)
-- ==============================================

-- 1. Add password_hash to profiles
-- checking if column exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'password_hash') THEN
        ALTER TABLE public.profiles ADD COLUMN password_hash text;
    END IF;
END $$;

-- 2. Create RPC to Verify Credentials (Bypassing Supabase Auth)
CREATE OR REPLACE FUNCTION verify_user_custom(
    input_email text,
    input_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions -- Ensure access to pgcrypto
AS $$
DECLARE
    target_profile record;
    is_valid boolean;
BEGIN
    -- Find user by email
    SELECT * INTO target_profile FROM public.profiles WHERE email = input_email LIMIT 1;
    
    IF target_profile IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Usuario no encontrado (Custom)');
    END IF;

    -- Check if password_hash exists
    IF target_profile.password_hash IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Este usuario no tiene contraseña de respaldo. Re-crea la cuenta.');
    END IF;

    -- Verify Password (using pgcrypto)
    -- crypt(input, hash) returns the hash if matches
    is_valid := (target_profile.password_hash = crypt(input_password, target_profile.password_hash));

    IF is_valid THEN
        -- Return User Data (Simulate Session)
        RETURN json_build_object(
            'success', true, 
            'user', json_build_object(
                'id', target_profile.id,
                'email', target_profile.email,
                'role', target_profile.role
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Contraseña incorrecta (Custom)');
    END IF;
END;
$$;
