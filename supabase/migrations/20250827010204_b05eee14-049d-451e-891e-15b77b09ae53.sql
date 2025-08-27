-- Corrigir função authenticate_by_cpf para usar a coluna correta
CREATE OR REPLACE FUNCTION authenticate_by_cpf(cpf_input text)
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
    -- Limpar CPF (remover pontos, traços, espaços)
    cpf_clean := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Validar CPF (deve ter 11 dígitos)
    IF LENGTH(cpf_clean) != 11 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF deve ter 11 dígitos'
        );
    END IF;
    
    -- Buscar perfil ativo
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE cpf = cpf_clean 
    AND status = 'ativo'
    ORDER BY inserted_at DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF não encontrado ou usuário inativo'
        );
    END IF;
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = profile_record.id;
    
    -- Retornar dados do usuário
    RETURN json_build_object(
        'success', true,
        'message', 'Usuário encontrado',
        'user', json_build_object(
            'id', profile_record.id,
            'full_name', profile_record.full_name,
            'cpf', profile_record.cpf,
            'email', profile_record.email,
            'role', profile_record.role,
            'userType', profile_record.role, -- Compatibilidade
            'has_pin', profile_record.two_factor_enabled,
            'two_factor_enabled', profile_record.two_factor_enabled,
            'congregation_id', profile_record.congregation_id,
            'photo_url', profile_record.photo_url,
            'can_edit', COALESCE(profile_record.can_edit, true),
            'tela_permitida', profile_record.role
        )
    );
END;
$$;