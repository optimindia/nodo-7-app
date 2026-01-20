-- Function to Pay Debt (Atomic Operation)
-- 1. Creates a withdrawal transaction
-- 2. Reduces the debt balance
create or replace function pay_debt(
  p_debt_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_description text,
  p_user_id uuid,
  p_date date
) returns json as $$
declare
  v_new_balance numeric;
  v_transaction_id uuid;
begin
  -- Check if debt exists and belongs to user
  if not exists (select 1 from debts where id = p_debt_id and user_id = p_user_id) then
    raise exception 'Deuda no encontrada o sin permiso.';
  end if;

  -- 1. Insert Transaction (This should trigger wallet balance update if triggers exist)
  insert into transactions (
    user_id,
    wallet_id,
    amount,
    type,
    description,
    category,
    date
  ) values (
    p_user_id,
    p_wallet_id,
    p_amount,
    'withdrawal',
    p_description,
    'Deudas',
    p_date
  ) returning id into v_transaction_id;

  -- 2. Update Debt Balance
  update debts
  set current_balance = GREATEST(0, current_balance - p_amount)
  where id = p_debt_id
  returning current_balance into v_new_balance;

  return json_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );

exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
