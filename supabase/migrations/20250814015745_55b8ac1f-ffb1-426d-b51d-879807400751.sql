-- Corrigir função authenticate_by_cpf para usar two_factor_pin ao invés de pin
CREATE OR REPLACE FUNCTION public.authenticate_by_cpf(cpf_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_record profiles%ROWTYPE;
    result JSON;
BEGIN
    -- Limpar CPF de formatação
    cpf_input := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Buscar usuário por CPF priorizando status ativo e usuários específicos
    SELECT * INTO user_record 
    FROM profiles 
    WHERE cpf = cpf_input
    ORDER BY 
        CASE WHEN status = 'ativo' THEN 1 ELSE 2 END,
        CASE WHEN full_name = 'MAURO ARRUDA DE ARRUDA' THEN 1 ELSE 2 END,
        updated_at DESC NULLS LAST
    LIMIT 1;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'CPF não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Atualizar último acesso
    UPDATE profiles 
    SET updated_at = now()
    WHERE id = user_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'CPF encontrado',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'cpf', user_record.cpf,
            'role', user_record.role,
            'photo_url', user_record.photo_url,
            'has_pin', (user_record.two_factor_pin IS NOT NULL AND user_record.two_factor_pin != ''),
            'tela_permitida', COALESCE(user_record.tela_permitida, 'admin'),
            'can_edit', COALESCE(user_record.can_edit, true),
            'terms_accepted', COALESCE(user_record.terms_accepted, false),
            'privacy_policy_accepted', COALESCE(user_record.privacy_policy_accepted, false),
            'two_factor_enabled', COALESCE(user_record.two_factor_enabled, false)
        )
    );
    
    RETURN result;
END;
$$;