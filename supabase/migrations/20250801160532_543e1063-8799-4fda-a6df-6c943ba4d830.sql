-- Create auth users for existing profiles that don't have auth accounts
-- This will allow the CPF login to work with Supabase authentication

DO $$
DECLARE
    profile_record RECORD;
    auth_user_exists BOOLEAN;
BEGIN
    -- Loop through profiles that have email addresses
    FOR profile_record IN 
        SELECT id, email, full_name 
        FROM profiles 
        WHERE email IS NOT NULL 
        AND email != ''
        AND role IN ('admin', 'coordenador', 'secretario', 'professor', 'pastor')
    LOOP
        -- Check if auth user already exists
        SELECT EXISTS(
            SELECT 1 FROM auth.users WHERE email = profile_record.email
        ) INTO auth_user_exists;
        
        -- Only create if doesn't exist
        IF NOT auth_user_exists THEN
            -- Insert into auth.users with default password hash for "mudar123"
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                role,
                aud
            ) VALUES (
                profile_record.id,
                '00000000-0000-0000-0000-000000000000',
                profile_record.email,
                '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash for "mudar123"
                NOW(),
                NOW(),
                NOW(),
                '',
                '',
                '',
                '',
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('full_name', profile_record.full_name),
                false,
                'authenticated',
                'authenticated'
            ) ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Created auth user for: %', profile_record.email;
        END IF;
    END LOOP;
END $$;