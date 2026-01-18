-- ==============================================
-- DIAGNOSTIC: OFF SWITCH (DISABLE RLS)
-- ==============================================
-- This turns off ALL security policies on the profiles table.
-- If this fixes the login, we KNOW the problem is a "Recursive Policy Loop".

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Also, let's verify if the user actually exists in profiles
-- (Replace 'thiagoelpro@gmail.com' with the email giving you trouble if you want to check manually in SQL Editor)
-- SELECT * FROM public.profiles WHERE email = 'thiagoelpro@gmail.com';
