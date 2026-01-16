-- Comprehensive Fix: Ensure ALL required columns exist
-- This script is safe to run multiple times (it only adds what is missing)

-- 1. Description
alter table transactions 
add column if not exists description text;

-- 2. Category
alter table transactions 
add column if not exists category text default 'General';

-- 3. Date
alter table transactions 
add column if not exists date date default CURRENT_DATE;

-- 4. Wallet Link
alter table transactions 
add column if not exists wallet_id uuid references wallets(id);

-- 5. Goal Link
alter table transactions 
add column if not exists goal_id uuid references goals(id);

-- 6. Ensure RLS is enabled just in case
alter table transactions enable row level security;
