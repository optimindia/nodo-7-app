-- Change date column type to TIMESTAMPTZ to store time information
ALTER TABLE transactions 
ALTER COLUMN date TYPE timestamptz USING date::timestamptz;
