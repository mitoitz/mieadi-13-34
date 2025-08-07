-- Corrigir função de autenticação por email para aceitar senhas não-hash
CREATE OR REPLACE FUNCTION public.authenticate_by_email(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
    profile_record RECORD;
BEGIN
    -- Buscar usuário na tabela de backup
    SELECT * INTO user_record
    FROM auth_users_backup
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Email não encontrado'
        );
    END IF;
    
    -- Verificar senha (comparação direta - sem hash para simplificar)
    IF user_record.encrypted_password != p_password THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Senha incorreta'
        );
    END IF;
    
    -- Buscar perfil completo
    SELECT * INTO profile_record
    FROM profiles
    WHERE id = user_record.profile_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Perfil não encontrado'
        );
    END IF;
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = profile_record.id;
    
    -- Retornar sucesso com dados do usuário
    RETURN json_build_object(
        'success', true,
        'message', 'Login realizado com sucesso',
        'user', json_build_object(
            'id', profile_record.id,
            'full_name', profile_record.full_name,
            'email', profile_record.email,
            'cpf', profile_record.cpf,
            'role', profile_record.role,
            'congregation_id', profile_record.congregation_id,
            'photo_url', profile_record.photo_url,
            'terms_accepted', profile_record.terms_accepted,
            'privacy_policy_accepted', profile_record.privacy_policy_accepted,
            'two_factor_enabled', profile_record.two_factor_enabled
        ),
        'session', json_build_object(
            'access_token', 'local_token_' || profile_record.id,
            'user', json_build_object(
                'id', profile_record.id,
                'email', profile_record.email
            )
        )
    );
END;
$function$;