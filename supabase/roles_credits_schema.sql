-- ==============================================
-- ROLES & CREDITS SYSTEM MIGRATION
-- ==============================================

-- 1. Add new columns to 'profiles'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'client' CHECK (role IN ('admin', 'reseller', 'client')),
ADD COLUMN IF NOT EXISTS credits int DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial'));

-- 2. Create Helper Function to avoid RLS recursion
-- This function allows us to check a user's role without triggering infinite RLS loops
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Reset RLS Policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Resellers can view their clients" ON profiles;
DROP POLICY IF EXISTS "Resellers can update their clients" ON profiles;

-- 4. Essential Policy: Users can see their own profile
-- This is critical for the app to load for any user
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 5. Admin Policies
-- Admins can see EVERYTHING
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (get_my_role() = 'admin');

-- Admins can update EVERYTHING (manage credits, roles, bans)
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (get_my_role() = 'admin');

-- 6. Reseller Policies
-- Resellers can see profiles they created OR themselves
CREATE POLICY "Resellers can view their clients" 
ON profiles FOR SELECT 
USING (
  created_by = auth.uid() 
  OR 
  id = auth.uid()
);

-- Resellers can update profiles they created (e.g. deactivate)
CREATE POLICY "Resellers can update their clients" 
ON profiles FOR UPDATE 
USING (
  created_by = auth.uid()
);

-- 7. Client Policies
-- Clients can ONLY update their own basic info (handled by "Users can update own profile" if we want)
-- For now, let's keep it restricted or add if needed.
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
