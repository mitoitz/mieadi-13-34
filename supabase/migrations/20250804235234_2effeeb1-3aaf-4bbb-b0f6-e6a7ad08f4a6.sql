-- Verificar se o usuário diretor já existe no sistema de autenticação
-- Se não existir, vamos usar a função já disponível no sistema

DO $$
DECLARE
    profile_exists BOOLEAN;
    auth_exists BOOLEAN;
    result_text TEXT;
BEGIN
    -- Verificar se o perfil existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = 'diretor@mieadi.com.br' AND role = 'diretor') INTO profile_exists;
    
    -- Verificar se já existe autenticação
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'diretor@mieadi.com.br') INTO auth_exists;
    
    IF profile_exists AND NOT auth_exists THEN
        -- Usar função existente para criar conta de autenticação
        SELECT create_supabase_auth_for_profile('diretor@mieadi.com.br', 'Diretor123!') INTO result_text;
        RAISE NOTICE 'Resultado da criação de autenticação: %', result_text;
    ELSIF profile_exists AND auth_exists THEN
        RAISE NOTICE 'Usuário já existe no sistema de autenticação';
    ELSE
        RAISE NOTICE 'Perfil do diretor não encontrado';
    END IF;
END $$;