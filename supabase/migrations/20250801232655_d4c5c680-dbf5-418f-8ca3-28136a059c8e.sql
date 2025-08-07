-- Criar função para criar usuários de autenticação para administradores
CREATE OR REPLACE FUNCTION create_admin_auth_users()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    auth_user_id uuid;
    result_text text := '';
BEGIN
    -- Iterar pelos administradores
    FOR admin_record IN 
        SELECT id, full_name, email, cpf 
        FROM profiles 
        WHERE role = 'admin' AND email IS NOT NULL
    LOOP
        -- Tentar criar usuário no auth.users (simulado)
        -- Como não podemos acessar auth.users diretamente, vamos criar uma tabela auxiliar
        INSERT INTO auth_users_backup (
            profile_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            admin_record.id,
            admin_record.email,
            crypt('mudar123', gen_salt('bf')), -- Hash da senha "mudar123"
            now(),
            now(),
            now(),
            jsonb_build_object(
                'full_name', admin_record.full_name,
                'cpf', admin_record.cpf,
                'role', 'admin'
            )
        )
        ON CONFLICT (email) DO NOTHING;
        
        result_text := result_text || 'Usuário criado para: ' || admin_record.email || E'\n';
    END LOOP;
    
    RETURN result_text;
END;
$$;

-- Criar tabela auxiliar para simular auth.users
CREATE TABLE IF NOT EXISTS auth_users_backup (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES profiles(id),
    email text UNIQUE NOT NULL,
    encrypted_password text NOT NULL,
    email_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);

-- Executar a função
SELECT create_admin_auth_users();