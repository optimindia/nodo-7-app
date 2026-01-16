-- ==============================================
-- MASTER UPDATE SCRIPT
-- Run this in Supabase SQL Editor to upgrade your DB
-- ==============================================

-- 1. Add new columns to 'profiles' if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'currency') then
        alter table profiles add column currency text default 'USD';
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'language') then
        alter table profiles add column language text default 'es';
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'theme') then
        alter table profiles add column theme text default 'dark';
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bio') then
        alter table profiles add column bio text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'tier') then
        alter table profiles add column tier text default 'standard';
    end if;
     
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'notifications_enabled') then
        alter table profiles add column notifications_enabled boolean default true;
    end if;
end $$;

-- 2. Ensure RLS allows updates (should already be set, but good to double check)
-- "Users can update own profile" policy created previously covers these new columns automatically.

-- 3. (Optional) Create a 'tiers' table if you want to manage plan details dynamically in the future,
-- but for now keeping it simple with a column is better.
