-- Corrigir as funções PIN com casting explícito do gen_salt

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
    
    -- Gerar hash do PIN usando crypt com gen_salt especificando o tipo
    pin_hash_value := crypt(new_pin, gen_salt('bf'::text));
    
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