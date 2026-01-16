-- Add date column 
alter table transactions 
add column if not exists date date default CURRENT_DATE;

-- In case wallet_id was also missing (it shouldn't, but let's be safe)
alter table transactions 
add column if not exists wallet_id uuid references wallets(id);
