-- ==============================================
-- FIX RLS POLICIES SCRIPT
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Reset Policies for Transactions
-- We drop existing policies to ensure a clean slate and avoid conflicts
drop policy if exists "Users can view own transactions" on transactions;
drop policy if exists "Users can insert own transactions" on transactions;
drop policy if exists "Enable read access for all users" on transactions; 
-- (Drop any other potential misnamed policies)

-- 2. Create Comprehensive Policies
-- VIEW
create policy "Users can view own transactions" 
on transactions for select 
using (auth.uid() = user_id);

-- INSERT
create policy "Users can insert own transactions" 
on transactions for insert 
with check (auth.uid() = user_id);

-- UPDATE (Fix for editing)
create policy "Users can update own transactions" 
on transactions for update 
using (auth.uid() = user_id);

-- DELETE (Fix for deleting)
create policy "Users can delete own transactions" 
on transactions for delete 
using (auth.uid() = user_id);

-- 3. Verify Profiles Policies (Just in case)
alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can view own profile" 
on profiles for select 
using (auth.uid() = id);

create policy "Users can update own profile" 
on profiles for update 
using (auth.uid() = id);

create policy "Users can insert own profile" 
on profiles for insert 
with check (auth.uid() = id);
