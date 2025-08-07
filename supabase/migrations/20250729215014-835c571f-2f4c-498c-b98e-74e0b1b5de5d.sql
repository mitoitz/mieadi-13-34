-- Fix security issues from migration
-- Enable RLS on all public tables that need it
DO $$
DECLARE
    table_name text;
BEGIN
    -- List of tables that need RLS enabled
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('profiles') -- profiles already has RLS
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- Fix function search paths
ALTER FUNCTION generate_qr_code() SET search_path = '';
ALTER FUNCTION auto_generate_qr_code() SET search_path = '';

-- Create password reset function
CREATE OR REPLACE FUNCTION reset_user_password(user_cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles 
    SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_login = TRUE,
        last_password_change = NOW()
    WHERE cpf = user_cpf;
    
    RETURN FOUND;
END;
$$;