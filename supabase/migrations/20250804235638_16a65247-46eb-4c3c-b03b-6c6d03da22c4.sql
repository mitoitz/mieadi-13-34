-- Criar usuário diretor usando Supabase Auth Admin API simulado
-- Vamos garantir que a conta seja criada corretamente

DO $$
DECLARE
    director_id UUID := '2105fb66-4072-4676-846d-bfb8dbe8734a';
    director_email TEXT := 'diretor@mieadi.com.br';
    director_password TEXT := 'Diretor123!';
    salt TEXT;
    hashed_password TEXT;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Deletar qualquer registro existente primeiro
    DELETE FROM auth.identities WHERE user_id = director_id;
    DELETE FROM auth.users WHERE id = director_id OR email = director_email;
    
    -- Gerar hash da senha usando bcrypt
    salt := gen_salt('bf');
    hashed_password := crypt(director_password, salt);
    
    -- Inserir usuário no auth.users com todos os campos necessários
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        phone_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        new_email,
        new_phone,
        invited_at,
        action_link,
        email_change,
        email_change_token_new,
        email_change_token_current,
        confirmation_token,
        recovery_token,
        phone_change_token,
        created_at,
        updated_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        phone,
        phone_change,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        director_id,
        'authenticated',
        'authenticated',
        director_email,
        hashed_password,
        current_time,
        NULL,
        NULL,
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        current_time,
        current_time,
        current_time,
        jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        jsonb_build_object(
            'full_name', 'MAURO ARRUDA DE ARRUDA',
            'role', 'diretor'
        ),
        false,
        '',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
    );
    
    -- Inserir identity record
    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at,
        email
    ) VALUES (
        director_id::text,
        director_id,
        jsonb_build_object(
            'sub', director_id::text,
            'email', director_email,
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        current_time,
        current_time,
        current_time,
        director_email
    );
    
    RAISE NOTICE 'Usuário criado com sucesso: % / %', director_email, director_password;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao criar usuário: %', SQLERRM;
END $$;