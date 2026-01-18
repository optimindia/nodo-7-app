-- ==============================================
-- DIAGNOSTIC: SESSIONS & CONFIRMATION
-- ==============================================

-- 1. Check Triggers on auth.sessions (Login writes here)
select 
  trigger_name, 
  action_statement 
from information_schema.triggers 
where event_object_table = 'sessions' 
and event_object_schema = 'auth';

-- 2. Force Confirm the specific user (Just in case)
-- Replace with the troublesome email
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'thiagoelpro@gmail.com';
