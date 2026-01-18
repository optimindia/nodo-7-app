-- ==============================================
-- SECURE WALLET MANAGEMENT (RPCs for Custom Auth)
-- ==============================================

-- 1. Create Wallet RPC
CREATE OR REPLACE FUNCTION create_wallet_secure(
    p_user_id uuid,
    p_name text,
    p_type text,
    p_color text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
AS $$
DECLARE
    new_wallet_id uuid;
BEGIN
    INSERT INTO public.wallets (user_id, name, type, color)
    VALUES (p_user_id, p_name, p_type, p_color)
    RETURNING id INTO new_wallet_id;

    RETURN json_build_object('success', true, 'id', new_wallet_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. Update Wallet RPC
CREATE OR REPLACE FUNCTION update_wallet_secure(
    p_wallet_id uuid,
    p_name text,
    p_type text,
    p_color text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.wallets
    SET name = p_name, type = p_type, color = p_color
    WHERE id = p_wallet_id;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Delete Wallet RPC
CREATE OR REPLACE FUNCTION delete_wallet_secure(
    p_wallet_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.wallets WHERE id = p_wallet_id;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Fetch Wallets RPC (Crucial for reading back data)
CREATE OR REPLACE FUNCTION get_wallets_secure(
    p_user_id uuid
)
RETURNS SETOF public.wallets
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.wallets WHERE user_id = p_user_id ORDER BY created_at ASC;
$$;
