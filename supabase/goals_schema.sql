create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline text,
  icon text default 'target',
  color text default 'cyan',
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table goals enable row level security;

create policy "Users can view own goals"
  on goals for select
  using ( auth.uid() = user_id );

create policy "Users can insert own goals"
  on goals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own goals"
  on goals for update
  using ( auth.uid() = user_id );

create policy "Users can delete own goals"
  on goals for delete
  using ( auth.uid() = user_id );
