-- Simpler script to force update
-- Run this directly. 
-- If the columns already exist, it will do nothing (but won't error).
-- If they don't, it will create them.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'es';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;
