-- ==============================================
-- DIAGNOSTIC: COMPARE AUTH USERS
-- ==============================================

-- We are looking for differences between a WORKING user (Admin?) and BROKEN users.
-- Replace 'optimi...' with the email of the ADMIN you are currently using.
-- Replace 'thiago...' with the BROKEN user you tried to create (if it exists).

SELECT 
    id, 
    email, 
    role, 
    aud, 
    email_confirmed_at, 
    encrypted_password, -- Don't worry, it's hashed
    instance_id,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
