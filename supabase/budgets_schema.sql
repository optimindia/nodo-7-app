-- Create Budgets Table
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  category text not null, -- Stores the category name (e.g., 'Comida', 'Transporte')
  amount numeric not null, -- The limit amount
  period text default 'monthly', -- For future expansion (weekly/monthly/yearly)
  created_at timestamptz default now(),
  
  -- Constraint: A user can only have one budget per category per period (simplification for v1)
  unique(user_id, category, period)
);

-- Enable RLS
alter table budgets enable row level security;

-- Policies
create policy "Users can view their own budgets" 
  on budgets for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets" 
  on budgets for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets" 
  on budgets for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own budgets" 
  on budgets for delete 
  using (auth.uid() = user_id);
