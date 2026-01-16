-- Add goal_id column to transactions table
alter table transactions 
add column if not exists goal_id uuid references goals(id);
