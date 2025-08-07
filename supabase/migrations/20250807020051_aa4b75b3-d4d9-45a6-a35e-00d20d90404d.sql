-- Dropar e recriar as funções com nomes corretos
DROP FUNCTION IF EXISTS public.set_user_pin(text, text);

CREATE OR REPLACE FUNCTION public.set_user_pin(input_cpf text, new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record RECORD;
    pin_hash TEXT;
    result JSON;
    clean_cpf TEXT;
BEGIN
    -- Limpar CPF
    clean_cpf := REGEXP_REPLACE(input_cpf, '[^0-9]', '', 'g');
    
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
    WHERE cpf = clean_cpf;
    
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