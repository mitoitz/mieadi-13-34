-- Verificar se o usuário diretor tem conta de autenticação no Supabase
-- e criar se necessário

DO $$
DECLARE
    director_profile RECORD;
    director_password TEXT := 'Diretor123!';
BEGIN
    -- Buscar perfil do diretor
    SELECT * INTO director_profile 
    FROM profiles 
    WHERE email = 'diretor@mieadi.com.br' AND role = 'diretor';
    
    IF FOUND THEN
        -- Verificar se já existe no auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'diretor@mieadi.com.br') THEN
            -- Criar usuário de autenticação
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                recovery_sent_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                director_profile.id,
                'authenticated',
                'authenticated',
                director_profile.email,
                crypt(director_password, gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object(
                    'full_name', director_profile.full_name,
                    'role', director_profile.role
                ),
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );
            
            -- Criar identity record
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                director_profile.id,
                jsonb_build_object(
                    'sub', director_profile.id::text,
                    'email', director_profile.email
                ),
                'email',
                NOW(),
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Usuário de autenticação criado para: %', director_profile.email;
        ELSE
            -- Atualizar senha se já existe
            UPDATE auth.users 
            SET encrypted_password = crypt(director_password, gen_salt('bf')),
                email_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE email = 'diretor@mieadi.com.br';
            
            RAISE NOTICE 'Senha atualizada para: %', director_profile.email;
        END IF;
    ELSE
        RAISE NOTICE 'Perfil do diretor não encontrado';
    END IF;
END $$;