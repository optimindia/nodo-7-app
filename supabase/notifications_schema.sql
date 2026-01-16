-- Create Notifications Table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  message text not null,
  type text check (type in ('motivation', 'alert', 'success', 'system')) default 'system',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select
  using ( auth.uid() = user_id );

create policy "Users can update own notifications"
  on notifications for update
  using ( auth.uid() = user_id );

create policy "Users can insert system notifications" 
  on notifications for insert
  with check ( auth.uid() = user_id );
