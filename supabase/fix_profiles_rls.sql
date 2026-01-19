-- Ensure column exists
alter table profiles 
add column if not exists has_completed_setup boolean default false;

-- Enable RLS
alter table profiles enable row level security;

-- Drop existing update policy to recreate it safely
drop policy if exists "Users can update own profile" on profiles;

-- Create update policy
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- Drop existing insert policy to recreate it safely
drop policy if exists "Users can insert own profile" on profiles;

-- Create insert policy (sometimes needed if profile doesn't exist yet, though triggers usually handle this)
create policy "Users can insert own profile"
on profiles for insert
with check ( auth.uid() = id );

-- Grant permissions explicitly
grant all on table profiles to authenticated;
grant all on table profiles to service_role;
