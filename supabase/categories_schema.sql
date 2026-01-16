create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null default 'expense', -- 'income' or 'expense'
  icon text, -- Emoji or icon name
  color text default 'blue',
  is_default boolean default false, -- To distinguish seeded categories if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table categories enable row level security;

create policy "Users can view own categories"
  on categories for select
  using ( auth.uid() = user_id );

create policy "Users can insert own categories"
  on categories for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own categories"
  on categories for update
  using ( auth.uid() = user_id );

create policy "Users can delete own categories"
  on categories for delete
  using ( auth.uid() = user_id );
