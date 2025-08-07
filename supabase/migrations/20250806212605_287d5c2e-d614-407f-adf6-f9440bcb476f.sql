-- Update existing functions to use proper pgcrypto function calls

-- Recreate set_user_pin function with correct signature and pgcrypto usage
CREATE OR REPLACE FUNCTION public.set_user_pin(cpf text, new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_record profiles%ROWTYPE;
    pin_hash_value TEXT;
    affected_rows INTEGER;
BEGIN
    -- Limpar CPF de formatação
    cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Validar PIN (4 dígitos)
    IF new_pin !~ '^\d{4}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PIN deve conter exatamente 4 números'
        );
    END IF;
    
    -- Buscar usuário por CPF
    SELECT * INTO user_record 
    FROM profiles 
    WHERE profiles.cpf = set_user_pin.cpf;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF não encontrado no sistema'
        );
    END IF;
    
    -- Gerar hash do PIN usando pgcrypto.crypt com pgcrypto.gen_salt
    pin_hash_value := crypt(new_pin, gen_salt('bf'));
    
    -- Atualizar PIN do usuário
    UPDATE profiles 
    SET 
        pin_hash = pin_hash_value,
        pin = pin_hash_value, -- Manter compatibilidade com campo antigo
        updated_at = now()
    WHERE profiles.cpf = set_user_pin.cpf;
    
    -- Verificar se a atualização foi bem-sucedida
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar PIN'
        );
    END IF;
    
    -- Log da operação (opcional)
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        user_record.id,
        'PIN_UPDATE',
        'profiles',
        user_record.id::text,
        json_build_object('message', 'PIN atualizado com sucesso')
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'PIN configurado com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro interno: ' || SQLERRM
        );
END;
$$;

-- Recreate verify_user_pin function with correct signature
CREATE OR REPLACE FUNCTION public.verify_user_pin(cpf text, pin_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_record profiles%ROWTYPE;
    stored_hash TEXT;
BEGIN
    -- Limpar CPF de formatação
    cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Validar PIN (4 dígitos)
    IF pin_input !~ '^\d{4}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PIN deve conter exatamente 4 números'
        );
    END IF;
    
    -- Buscar usuário por CPF
    SELECT * INTO user_record 
    FROM profiles 
    WHERE profiles.cpf = verify_user_pin.cpf;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'CPF não encontrado no sistema'
        );
    END IF;
    
    -- Obter hash armazenado (priorizar pin_hash, fallback para pin)
    stored_hash := COALESCE(user_record.pin_hash, user_record.pin);
    
    IF stored_hash IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PIN não foi configurado para este usuário'
        );
    END IF;
    
    -- Verificar PIN usando crypt
    IF crypt(pin_input, stored_hash) = stored_hash THEN
        -- Atualizar último acesso
        UPDATE profiles 
        SET updated_at = now()
        WHERE id = user_record.id;
        
        RETURN json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso',
            'user', json_build_object(
                'id', user_record.id,
                'full_name', user_record.full_name,
                'cpf', user_record.cpf,
                'role', user_record.role,
                'photo_url', user_record.photo_url,
                'tela_permitida', COALESCE(user_record.tela_permitida, 'dashboard'),
                'can_edit', COALESCE(user_record.can_edit, true)
            )
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'PIN incorreto'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro interno: ' || SQLERRM
        );
END;
$$;