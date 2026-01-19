-- Add has_completed_setup column to profiles table if it doesn't exist
alter table profiles 
add column if not exists has_completed_setup boolean default false;

-- Update RLS policies to allow users to update this field (if strictly scoped)
-- Usually the existing update policy 'Users can update own profile' covers all columns, 
-- but ensuring it's open for this is good.
