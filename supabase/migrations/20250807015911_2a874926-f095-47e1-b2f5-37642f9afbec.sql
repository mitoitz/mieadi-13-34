-- Habilitar a extensão pgcrypto para funções de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar a função verify_user_pin com a extensão habilitada
CREATE OR REPLACE FUNCTION public.verify_user_pin(cpf_input text, pin_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    -- Limpar CPF (remover formatação)
    cpf_input := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Buscar perfil por CPF
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE cpf = cpf_input;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'CPF não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Verificar se tem PIN configurado
    IF profile_record.pin_hash IS NULL AND profile_record.two_factor_pin IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'PIN não configurado para este usuário'
        );
        RETURN result;
    END IF;
    
    -- Verificar PIN (primeiro tenta o hash, depois o PIN simples para compatibilidade)
    IF (profile_record.pin_hash IS NOT NULL AND crypt(pin_input, profile_record.pin_hash) = profile_record.pin_hash) OR
       (profile_record.two_factor_pin IS NOT NULL AND profile_record.two_factor_pin = pin_input) THEN
        
        -- PIN correto - resetar tentativas
        UPDATE profiles 
        SET pin_attempts = 0, 
            pin_locked_until = NULL,
            last_login = now()
        WHERE id = profile_record.id;
        
        result := json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso',
            'user', json_build_object(
                'id', profile_record.id,
                'full_name', profile_record.full_name,
                'cpf', profile_record.cpf,
                'role', profile_record.role,
                'photo_url', profile_record.photo_url,
                'has_pin', true,
                'tela_permitida', CASE 
                    WHEN profile_record.role IN ('diretor', 'admin', 'coordenador') THEN 'admin'
                    WHEN profile_record.role = 'secretario' THEN 'secretario'
                    WHEN profile_record.role = 'professor' THEN 'professor'
                    WHEN profile_record.role = 'aluno' THEN 'aluno'
                    ELSE 'membro'
                END,
                'can_edit', profile_record.role IN ('diretor', 'admin', 'coordenador', 'secretario'),
                'terms_accepted', COALESCE(profile_record.terms_accepted, false),
                'privacy_policy_accepted', COALESCE(profile_record.privacy_policy_accepted, false),
                'two_factor_enabled', COALESCE(profile_record.two_factor_enabled, false),
                'congregation_id', profile_record.congregation_id
            )
        );
    ELSE
        -- PIN incorreto - incrementar tentativas
        UPDATE profiles 
        SET pin_attempts = COALESCE(pin_attempts, 0) + 1,
            pin_locked_until = CASE 
                WHEN COALESCE(pin_attempts, 0) + 1 >= 3 THEN NOW() + INTERVAL '15 minutes'
                ELSE pin_locked_until 
            END
        WHERE id = profile_record.id;
        
        result := json_build_object(
            'success', false,
            'message', 'PIN incorreto',
            'attempts_remaining', 3 - (COALESCE(profile_record.pin_attempts, 0) + 1)
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- Recriar a função set_user_pin também
CREATE OR REPLACE FUNCTION public.set_user_pin(cpf text, new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    pin_hash TEXT;
    result JSON;
BEGIN
    -- Limpar CPF
    cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Validar PIN (4 dígitos)
    IF new_pin !~ '^\d{4}$' THEN
        result := json_build_object(
            'success', false,
            'error', 'PIN deve conter exatamente 4 números'
        );
        RETURN result;
    END IF;
    
    -- Buscar perfil por CPF
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE cpf = cpf;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'CPF não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Gerar hash do PIN
    SELECT crypt(new_pin, gen_salt('bf')) INTO pin_hash;
    
    -- Atualizar PIN
    UPDATE profiles 
    SET pin_hash = pin_hash,
        two_factor_pin = new_pin, -- Manter para compatibilidade
        two_factor_enabled = true,
        pin_attempts = 0,
        pin_locked_until = NULL,
        updated_at = now()
    WHERE id = profile_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'PIN configurado com sucesso'
    );
    
    RETURN result;
END;
$function$;