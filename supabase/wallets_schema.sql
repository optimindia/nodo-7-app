-- ==============================================
-- WALLETS UPDATE SCRIPT
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. Create Wallets Table
create table if not exists wallets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text default 'general', -- 'fiat', 'crypto', 'digital', 'bank'
    color text default 'cyan', -- For UI visualization
    is_default boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table wallets enable row level security;

-- 3. Create RLS Policies
create policy "Users can view own wallets" 
on wallets for select 
using (auth.uid() = user_id);

create policy "Users can insert own wallets" 
on wallets for insert 
with check (auth.uid() = user_id);

create policy "Users can update own wallets" 
on wallets for update 
using (auth.uid() = user_id);

create policy "Users can delete own wallets" 
on wallets for delete 
using (auth.uid() = user_id);

-- 4. Add wallet_id to transactions table
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'transactions' and column_name = 'wallet_id') then
        alter table transactions add column wallet_id uuid references wallets(id) on delete set null;
    end if;
end $$;
