-- Enable deletion of own notifications
create policy "Users can delete own notifications"
  on notifications for delete
  using ( auth.uid() = user_id );
