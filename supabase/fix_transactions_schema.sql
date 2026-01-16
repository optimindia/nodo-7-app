-- Add category column if it doesn't exist
alter table transactions 
add column if not exists category text default 'General';

-- Also ensure goal_id is there just in case
alter table transactions 
add column if not exists goal_id uuid references goals(id);
