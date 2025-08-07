-- Inserir usuário diretor diretamente na tabela auth.users
-- Primeiro vamos verificar se já existe
DO $$
DECLARE
    director_id uuid := '2105fb66-4072-4676-846d-bfb8dbe8734a';
    user_email text := 'diretor@mieadi.com.br';
    user_password text := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; -- hash para "mudar123"
BEGIN
    -- Deletar se já existe
    DELETE FROM auth.users WHERE email = user_email;
    DELETE FROM auth.identities WHERE user_id = director_id;
    
    -- Inserir usuário na auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_user_meta_data
    ) VALUES (
        director_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        user_password,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        '{"role": "diretor", "full_name": "MAURO ARRUDA DE ARRUDA"}'::jsonb
    );
    
    -- Inserir identidade
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
        director_id,
        ('{"sub": "' || director_id || '", "email": "' || user_email || '"}')::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Usuário criado com sucesso: % com senha padrão', user_email;
END $$;