-- ==============================================
-- DIAGNOSTIC: PERMISSION RESET (THE HAMMER)
-- ==============================================
-- "Database error querying schema" often means the API user (anon/authenticated)
-- lost permissions to see the schema itself.

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
