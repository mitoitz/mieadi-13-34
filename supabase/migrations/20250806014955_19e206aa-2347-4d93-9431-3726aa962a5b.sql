-- Corrigir função authenticate_by_cpf para priorizar usuário ativo
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
    
    -- Buscar usuário por CPF priorizando status ativo e MAURO ARRUDA DE ARRUDA
    SELECT * INTO user_record 
    FROM profiles 
    WHERE cpf = cpf_input
    ORDER BY 
        CASE WHEN status = 'ativo' THEN 1 ELSE 2 END,
        CASE WHEN full_name = 'MAURO ARRUDA DE ARRUDA' THEN 1 ELSE 2 END,
        created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'CPF não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = user_record.id;
    
    -- Definir contexto do usuário para RLS
    PERFORM set_current_user_context(user_record.cpf);
    
    result := json_build_object(
        'success', true,
        'message', 'CPF encontrado',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'cpf', user_record.cpf,
            'role', user_record.role,
            'photo_url', user_record.photo_url,
            'has_pin', (user_record.pin IS NOT NULL OR user_record.two_factor_pin IS NOT NULL),
            'tela_permitida', COALESCE(user_record.tela_permitida, 'admin'),
            'can_edit', COALESCE(user_record.can_edit, true)
        )
    );
    
    RETURN result;
END;
$$;