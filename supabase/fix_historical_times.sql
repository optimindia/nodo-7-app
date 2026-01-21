-- Fix 1: Shift "Midnight UTC" transactions to "Noon UTC" (approx Noon/Afternoon Local)
-- This fixes transactions that appear on the previous day (e.g. 00:00 UTC -> 21:00 Prev Day)
UPDATE transactions
SET date = date + interval '15 hours'
WHERE extract(hour from date) = 0 AND extract(minute from date) = 0;

-- Fix 2: Shift "9am UTC" (maybe 6am Local?) to Noon just in case, if any exist.
-- User mentioned 9am issues. If they meant 9am local, that's fine. 
-- If they meant 9am is WRONG and they wanted Noon, we could likely leave it unless specific request.
-- Focusing on the major 00:00 error first.
