-- Function to safely deduct credit from a reseller
-- Returns json with { success: boolean, new_balance: number, message: text }
create or replace function deduct_reseller_credit(p_amount int)
returns json
language plpgsql
security definer -- Runs with permissions of the function creator (admin)
as $$
declare
  current_credits int;
  user_role text;
begin
  -- 1. Check if user is a Reseller
  select role, credits into user_role, current_credits
  from profiles
  where id = auth.uid();

  if user_role <> 'reseller' then
     return json_build_object('success', false, 'message', 'Solo los revendedores consumen créditos.');
  end if;

  -- 2. Check Balance
  if current_credits < p_amount then
     return json_build_object('success', false, 'message', 'Saldo insuficiente. Recarga créditos.');
  end if;

  -- 3. Deduct
  update profiles
  set credits = credits - p_amount
  where id = auth.uid();

  return json_build_object('success', true, 'new_balance', current_credits - p_amount, 'message', 'Crédito descontado.');
end;
$$;
