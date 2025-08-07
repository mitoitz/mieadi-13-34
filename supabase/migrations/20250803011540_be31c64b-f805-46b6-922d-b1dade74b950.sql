-- Vamos verificar se existe uma entrada correspondente na tabela auth.users
-- E criar uma conta de autenticação para o perfil existente se necessário

-- Primeiro, vamos verificar se já existe uma conta auth
DO $$
DECLARE
    profile_record RECORD;
    auth_user_id UUID;
BEGIN
    -- Buscar o perfil do diretor
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE email = 'mauro.admin@mieadi.com' AND role = 'diretor';
    
    IF FOUND THEN
        RAISE NOTICE 'Perfil encontrado: % (ID: %)', profile_record.full_name, profile_record.id;
        
        -- Verificar se já existe uma conta auth para este usuário
        SELECT id INTO auth_user_id 
        FROM auth.users 
        WHERE email = 'mauro.admin@mieadi.com';
        
        IF NOT FOUND THEN
            -- Criar conta auth para o usuário
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_user_meta_data,
                is_super_admin,
                role
            ) VALUES (
                profile_record.id,
                '00000000-0000-0000-0000-000000000000',
                'mauro.admin@mieadi.com',
                crypt('mudar123', gen_salt('bf')), -- Senha padrão: mudar123
                NOW(),
                NOW(),
                NOW(),
                jsonb_build_object(
                    'full_name', profile_record.full_name,
                    'role', profile_record.role
                ),
                false,
                'authenticated'
            );
            
            RAISE NOTICE 'Conta de autenticação criada para %', profile_record.full_name;
        ELSE
            RAISE NOTICE 'Conta de autenticação já existe para %', profile_record.full_name;
        END IF;
    ELSE
        RAISE NOTICE 'Perfil não encontrado para mauro.admin@mieadi.com';
    END IF;
END $$;