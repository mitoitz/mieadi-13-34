-- Criar função RPC para configurar PIN do usuário
CREATE OR REPLACE FUNCTION public.set_user_pin(cpf text, new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record profiles%ROWTYPE;
    pin_hash TEXT;
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
    
    -- Gerar hash do PIN usando bcrypt
    pin_hash := crypt(new_pin, gen_salt('bf'));
    
    -- Atualizar PIN do usuário
    UPDATE profiles 
    SET 
        pin = pin_hash,
        updated_at = now()
    WHERE profiles.cpf = set_user_pin.cpf;
    
    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar PIN'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'PIN configurado com sucesso'
    );
END;
$function$;