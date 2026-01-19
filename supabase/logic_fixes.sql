-- ==============================================
-- LOGIC FIXES: RLS & CREDITS
-- ==============================================

-- 1. FIX VISIBILITY (RLS)
-- Allow Resellers (and Admins) to see profiles they created or all profiles.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "View own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Resellers view created profiles" ON public.profiles 
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins view all profiles" ON public.profiles 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. CREDIT DEDUCTION RPC
CREATE OR REPLACE FUNCTION deduct_reseller_credit(p_amount int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits int;
BEGIN
  -- Check current credits
  SELECT credits INTO current_credits FROM public.profiles WHERE id = auth.uid();
  
  IF current_credits < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Créditos insuficientes');
  END IF;

  -- Deduct
  UPDATE public.profiles 
  SET credits = credits - p_amount 
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'new_balance', current_credits - p_amount);
END;
$$;
