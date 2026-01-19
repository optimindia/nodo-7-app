-- Create Shopping Lists Table
create table public.shopping_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  total_spent numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Shopping Items Table
create table public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  name text not null,
  is_checked boolean default false,
  quantity integer default 1,
  estimated_price numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Recurring Templates Table
create table public.recurring_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric not null,
  description text not null,
  category text not null,
  wallet_id uuid references public.wallets(id) on delete set null,
  frequency text check (frequency in ('monthly', 'weekly', 'yearly', 'daily')) default 'monthly',
  next_due_date date not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.recurring_templates enable row level security;

create policy "Users can view their own shopping lists" 
on public.shopping_lists for select using (auth.uid() = user_id);

create policy "Users can insert their own shopping lists" 
on public.shopping_lists for insert with check (auth.uid() = user_id);

create policy "Users can update their own shopping lists" 
on public.shopping_lists for update using (auth.uid() = user_id);

create policy "Users can delete their own shopping lists" 
on public.shopping_lists for delete using (auth.uid() = user_id);

create policy "Users can view items of their lists" 
on public.shopping_items for select using (
  exists (
    select 1 from public.shopping_lists 
    where id = public.shopping_items.list_id and user_id = auth.uid()
  )
);

create policy "Users can insert items to their lists" 
on public.shopping_items for insert with check (
  exists (
    select 1 from public.shopping_lists 
    where id = list_id and user_id = auth.uid()
  )
);

create policy "Users can update items of their lists" 
on public.shopping_items for update using (
  exists (
    select 1 from public.shopping_lists 
    where id = list_id and user_id = auth.uid()
  )
);

create policy "Users can delete items of their lists" 
on public.shopping_items for delete using (
  exists (
    select 1 from public.shopping_lists 
    where id = list_id and user_id = auth.uid()
  )
);

create policy "Users can manage their own recurring templates" 
on public.recurring_templates for all using (auth.uid() = user_id);
