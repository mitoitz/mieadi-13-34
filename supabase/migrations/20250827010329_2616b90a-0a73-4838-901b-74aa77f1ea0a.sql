-- Corrigir função verify_user_pin removendo campos inexistentes
CREATE OR REPLACE FUNCTION verify_user_pin(cpf_input text, pin_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cpf_clean text;
    profile_record RECORD;
    result json;
BEGIN
    -- Limpar CPF
    cpf_clean := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Validar PIN (4 dígitos)
    IF pin_input !~ '^\d{4}$' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN deve conter exatamente 4 números'
        );
    END IF;
    
    -- Buscar perfil
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE cpf = cpf_clean;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF não encontrado'
        );
    END IF;
    
    -- Verificar se tem PIN configurado
    IF profile_record.two_factor_pin IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN não configurado para este usuário'
        );
    END IF;
    
    -- Verificar PIN
    IF profile_record.two_factor_pin = pin_input THEN
        -- PIN correto - atualizar último login
        UPDATE profiles 
        SET last_login = now(),
            pin_attempts = 0,
            pin_locked_until = NULL
        WHERE id = profile_record.id;
        
        -- Definir contexto para RLS
        PERFORM set_config('app.current_user_cpf', cpf_clean, true);
        
        RETURN json_build_object(
            'success', true,
            'message', 'Login realizado com sucesso',
            'user', json_build_object(
                'id', profile_record.id,
                'full_name', profile_record.full_name,
                'cpf', profile_record.cpf,
                'email', profile_record.email,
                'role', profile_record.role,
                'userType', profile_record.role,
                'has_pin', true,
                'two_factor_enabled', true,
                'congregation_id', profile_record.congregation_id,
                'photo_url', profile_record.photo_url,
                'can_edit', COALESCE(profile_record.can_edit, true),
                'tela_permitida', profile_record.role
            )
        );
    ELSE
        -- PIN incorreto - incrementar tentativas
        UPDATE profiles 
        SET pin_attempts = COALESCE(pin_attempts, 0) + 1,
            pin_locked_until = CASE 
                WHEN COALESCE(pin_attempts, 0) + 1 >= 3 
                THEN NOW() + INTERVAL '15 minutes'
                ELSE pin_locked_until 
            END
        WHERE id = profile_record.id;
        
        RETURN json_build_object(
            'success', false,
            'message', 'PIN incorreto',
            'attempts_remaining', 3 - (COALESCE(profile_record.pin_attempts, 0) + 1)
        );
    END IF;
END;
$$;