-- Create Debts Table
create table public.debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  total_amount numeric not null, -- Original Debt
  current_balance numeric not null, -- What is left to pay
  interest_rate numeric default 0, -- Annual Interest Rate %
  min_payment numeric default 0, -- Minimum Monthly Payment
  category text, -- e.g., 'Credit Card', 'Loan'
  due_date date, -- Next Payment Date (optional)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.debts enable row level security;

-- Policies
create policy "Users can view their own debts" 
on public.debts for select using (auth.uid() = user_id);

create policy "Users can insert their own debts" 
on public.debts for insert with check (auth.uid() = user_id);

create policy "Users can update their own debts" 
on public.debts for update using (auth.uid() = user_id);

create policy "Users can delete their own debts" 
on public.debts for delete using (auth.uid() = user_id);
