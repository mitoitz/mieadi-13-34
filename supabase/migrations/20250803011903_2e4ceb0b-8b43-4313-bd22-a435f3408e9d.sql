-- Corrigir a conta de autenticação para usar o ID correto do perfil
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Buscar o perfil do diretor
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE email = 'mauro.admin@mieadi.com' AND role = 'diretor';
    
    IF FOUND THEN
        -- Deletar conta auth existente com ID incorreto
        DELETE FROM auth.users WHERE email = 'mauro.admin@mieadi.com';
        
        -- Criar nova conta auth com ID correto
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            profile_record.id, -- Usar o ID do perfil
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated', 
            'mauro.admin@mieadi.com',
            crypt('mudar123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'full_name', profile_record.full_name,
                'role', profile_record.role
            )
        );
        
        -- Criar identidade
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            profile_record.id,
            profile_record.id,
            jsonb_build_object(
                'sub', profile_record.id::text,
                'email', profile_record.email
            ),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Conta de autenticação recriada com ID correto: %', profile_record.id;
    END IF;
END $$;