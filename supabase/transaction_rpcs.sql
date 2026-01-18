-- ==============================================
-- SECURE TRANSACTION MANAGEMENT (RPCs)
-- ==============================================

-- 1. Create Transaction
CREATE OR REPLACE FUNCTION create_transaction_secure(
    p_user_id uuid,
    p_wallet_id uuid,
    p_amount numeric,
    p_type text,
    p_description text,
    p_category text,
    p_date timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tx_id uuid;
BEGIN
    INSERT INTO public.transactions (user_id, wallet_id, amount, type, description, category, date, created_at)
    VALUES (p_user_id, p_wallet_id, p_amount, p_type, p_description, p_category, p_date, now())
    RETURNING id INTO new_tx_id;

    RETURN json_build_object('success', true, 'id', new_tx_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. Update Transaction
CREATE OR REPLACE FUNCTION update_transaction_secure(
    p_tx_id uuid,
    p_amount numeric,
    p_type text,
    p_description text,
    p_category text,
    p_date timestamp with time zone,
    p_wallet_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.transactions
    SET amount = p_amount,
        type = p_type,
        description = p_description,
        category = p_category,
        date = p_date,
        wallet_id = p_wallet_id
    WHERE id = p_tx_id;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Delete Transaction
CREATE OR REPLACE FUNCTION delete_transaction_secure(
    p_tx_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.transactions WHERE id = p_tx_id;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
