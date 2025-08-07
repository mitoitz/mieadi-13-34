-- Função para criar usuário no auth.users do Supabase
CREATE OR REPLACE FUNCTION create_auth_user_for_director()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    director_profile RECORD;
    user_password TEXT := 'Diretor123!';
    result_text TEXT := '';
BEGIN
    -- Buscar o perfil do diretor
    SELECT * INTO director_profile 
    FROM profiles 
    WHERE email = 'diretor@mieadi.com.br' AND role = 'diretor';
    
    IF NOT FOUND THEN
        RETURN 'Perfil do diretor não encontrado';
    END IF;
    
    -- Verificar se já existe no auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'diretor@mieadi.com.br') THEN
        -- Atualizar senha se já existe
        UPDATE auth.users 
        SET encrypted_password = crypt(user_password, gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = 'diretor@mieadi.com.br';
        
        result_text := 'Usuário já existe - senha atualizada para: ' || user_password;
    ELSE
        -- Criar novo usuário no auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            aud,
            role,
            instance_id
        ) VALUES (
            director_profile.id,
            director_profile.email,
            crypt(user_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'full_name', director_profile.full_name,
                'role', director_profile.role
            ),
            'authenticated',
            'authenticated',
            '00000000-0000-0000-0000-000000000000'
        );
        
        -- Criar identidade para o usuário
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
        
        result_text := 'Usuário criado com sucesso - email: ' || director_profile.email || ' senha: ' || user_password;
    END IF;
    
    RETURN result_text;
END;
$$;