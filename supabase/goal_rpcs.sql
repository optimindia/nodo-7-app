-- ==============================================
-- SECURE GOAL MANAGEMENT (RPCs)
-- ==============================================

-- 1. Update Goal Amount
CREATE OR REPLACE FUNCTION update_goal_amount_secure(
    p_goal_id uuid,
    p_current_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.goals
    SET current_amount = p_current_amount
    WHERE id = p_goal_id;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
