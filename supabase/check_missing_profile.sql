-- ==============================================
-- DIAGNOSTIC: MISSING PROFILE CHECK
-- ==============================================

-- 1. Check if the user exists in AUTH but NOT in PROFILES
-- Replace 'thiagoelpro@gmail.com' with the problematic email
SELECT 
    au.id as auth_id, 
    au.email as auth_email, 
    p.id as profile_id, 
    p.email as profile_email 
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'thiagoelpro@gmail.com';
