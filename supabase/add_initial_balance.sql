-- Add initial_balance column to wallets table
alter table wallets 
add column if not exists initial_balance numeric default 0;
