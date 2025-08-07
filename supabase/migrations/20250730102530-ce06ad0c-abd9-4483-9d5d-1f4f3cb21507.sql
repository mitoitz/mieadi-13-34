-- Adicionar campos para PIN de 2FA e aceitação de termos
ALTER TABLE public.profiles 
ADD COLUMN two_factor_pin VARCHAR(4),
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN pin_attempts INTEGER DEFAULT 0,
ADD COLUMN pin_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN privacy_policy_accepted BOOLEAN DEFAULT false,
ADD COLUMN privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE;

-- Função para verificar e limpar tentativas de PIN expiradas
CREATE OR REPLACE FUNCTION public.reset_pin_attempts_if_expired(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET pin_attempts = 0, pin_locked_until = NULL
    WHERE id = user_id 
    AND pin_locked_until IS NOT NULL 
    AND pin_locked_until < NOW();
END;
$$;

-- Função para verificar PIN
CREATE OR REPLACE FUNCTION public.verify_two_factor_pin(user_id UUID, pin_input VARCHAR(4))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    -- Resetar tentativas expiradas
    PERFORM reset_pin_attempts_if_expired(user_id);
    
    -- Buscar perfil
    SELECT * INTO profile_record 
    FROM public.profiles 
    WHERE id = user_id;
    
    -- Verificar se está bloqueado
    IF profile_record.pin_locked_until IS NOT NULL AND profile_record.pin_locked_until > NOW() THEN
        result := json_build_object(
            'success', false,
            'error', 'PIN temporariamente bloqueado. Tente novamente mais tarde.',
            'locked_until', profile_record.pin_locked_until
        );
        RETURN result;
    END IF;
    
    -- Verificar PIN
    IF profile_record.two_factor_pin = pin_input THEN
        -- PIN correto - resetar tentativas
        UPDATE public.profiles 
        SET pin_attempts = 0, pin_locked_until = NULL
        WHERE id = user_id;
        
        result := json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso'
        );
    ELSE
        -- PIN incorreto - incrementar tentativas
        UPDATE public.profiles 
        SET pin_attempts = COALESCE(pin_attempts, 0) + 1,
            pin_locked_until = CASE 
                WHEN COALESCE(pin_attempts, 0) + 1 >= 3 THEN NOW() + INTERVAL '15 minutes'
                ELSE pin_locked_until 
            END
        WHERE id = user_id;
        
        result := json_build_object(
            'success', false,
            'error', 'PIN incorreto',
            'attempts_remaining', 3 - (COALESCE(profile_record.pin_attempts, 0) + 1)
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Função para definir PIN de 2FA
CREATE OR REPLACE FUNCTION public.set_two_factor_pin(user_id UUID, new_pin VARCHAR(4))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validar PIN (apenas números, 4 dígitos)
    IF new_pin !~ '^\d{4}$' THEN
        result := json_build_object(
            'success', false,
            'error', 'PIN deve conter exatamente 4 números'
        );
        RETURN result;
    END IF;
    
    -- Atualizar PIN
    UPDATE public.profiles 
    SET two_factor_pin = new_pin,
        two_factor_enabled = true,
        pin_attempts = 0,
        pin_locked_until = NULL
    WHERE id = user_id;
    
    result := json_build_object(
        'success', true,
        'message', 'PIN de 2FA configurado com sucesso'
    );
    
    RETURN result;
END;
$$;

-- Função para aceitar termos e política
CREATE OR REPLACE FUNCTION public.accept_terms_and_privacy(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE public.profiles 
    SET terms_accepted = true,
        terms_accepted_at = NOW(),
        privacy_policy_accepted = true,
        privacy_policy_accepted_at = NOW()
    WHERE id = user_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Termos de uso e política de privacidade aceitos'
    );
    
    RETURN result;
END;
$$;