-- Verificar e ajustar a estrutura da tabela profiles conforme solicitado
-- Adicionar campos necessários que possam estar faltando

-- Atualizar estrutura da tabela profiles se necessário
DO $$ 
BEGIN
    -- Verificar se o campo pin_hash existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin_hash') THEN
        ALTER TABLE profiles ADD COLUMN pin_hash TEXT;
    END IF;
    
    -- Verificar se o campo pin_attempts existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin_attempts') THEN
        ALTER TABLE profiles ADD COLUMN pin_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Verificar se o campo pin_locked_until existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin_locked_until') THEN
        ALTER TABLE profiles ADD COLUMN pin_locked_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo last_login existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
        ALTER TABLE profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo first_login existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_login') THEN
        ALTER TABLE profiles ADD COLUMN first_login BOOLEAN DEFAULT true;
    END IF;
    
    -- Verificar se o campo password_hash existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'password_hash') THEN
        ALTER TABLE profiles ADD COLUMN password_hash TEXT;
    END IF;
    
    -- Verificar se o campo terms_accepted existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted') THEN
        ALTER TABLE profiles ADD COLUMN terms_accepted BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar se o campo terms_accepted_at existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at') THEN
        ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo privacy_policy_accepted existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_policy_accepted') THEN
        ALTER TABLE profiles ADD COLUMN privacy_policy_accepted BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar se o campo privacy_policy_accepted_at existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_policy_accepted_at') THEN
        ALTER TABLE profiles ADD COLUMN privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo two_factor_enabled existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar se o campo two_factor_pin existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'two_factor_pin') THEN
        ALTER TABLE profiles ADD COLUMN two_factor_pin VARCHAR(4);
    END IF;
    
    -- Verificar se o campo two_factor_secret existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'two_factor_secret') THEN
        ALTER TABLE profiles ADD COLUMN two_factor_secret TEXT;
    END IF;
    
    -- Verificar se o campo last_password_change existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_password_change') THEN
        ALTER TABLE profiles ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo email_confirmed_at existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_confirmed_at') THEN
        ALTER TABLE profiles ADD COLUMN email_confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se o campo is_absent existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_absent') THEN
        ALTER TABLE profiles ADD COLUMN is_absent BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar se o campo absence_reason existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'absence_reason') THEN
        ALTER TABLE profiles ADD COLUMN absence_reason TEXT;
    END IF;
    
    -- Verificar se o campo absence_start_date existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'absence_start_date') THEN
        ALTER TABLE profiles ADD COLUMN absence_start_date DATE;
    END IF;
    
    -- Verificar se o campo absence_end_date existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'absence_end_date') THEN
        ALTER TABLE profiles ADD COLUMN absence_end_date DATE;
    END IF;
    
    -- Verificar se o campo permissions existe, se não, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'permissions') THEN
        ALTER TABLE profiles ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Atualizar função set_user_pin para usar hash criptografado
CREATE OR REPLACE FUNCTION public.set_user_pin(cpf text, new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
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
    
    -- Buscar usuário por CPF
    SELECT * INTO user_record 
    FROM profiles 
    WHERE profiles.cpf = cpf;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Gerar hash do PIN usando bcrypt
    SELECT crypt(new_pin, gen_salt('bf')) INTO pin_hash;
    
    -- Atualizar PIN
    UPDATE profiles 
    SET pin_hash = pin_hash,
        two_factor_pin = new_pin, -- Manter para compatibilidade
        two_factor_enabled = true,
        pin_attempts = 0,
        pin_locked_until = NULL,
        updated_at = now()
    WHERE id = user_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'PIN configurado com sucesso'
    );
    
    RETURN result;
END;
$function$;

-- Atualizar função verify_user_pin para verificar hash
CREATE OR REPLACE FUNCTION public.verify_user_pin(cpf text, pin_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Limpar CPF
    cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Resetar tentativas expiradas
    PERFORM reset_pin_attempts_if_expired((SELECT id FROM profiles WHERE profiles.cpf = cpf));
    
    -- Buscar usuário por CPF
    SELECT * INTO user_record 
    FROM profiles 
    WHERE profiles.cpf = cpf;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'CPF não encontrado'
        );
        RETURN result;
    END IF;
    
    -- Verificar se está bloqueado
    IF user_record.pin_locked_until IS NOT NULL AND user_record.pin_locked_until > NOW() THEN
        result := json_build_object(
            'success', false,
            'message', 'PIN temporariamente bloqueado. Tente novamente mais tarde.',
            'locked_until', user_record.pin_locked_until
        );
        RETURN result;
    END IF;
    
    -- Verificar PIN (primeiro tentar hash, depois compatibilidade)
    IF (user_record.pin_hash IS NOT NULL AND user_record.pin_hash = crypt(pin_input, user_record.pin_hash)) OR
       (user_record.two_factor_pin IS NOT NULL AND user_record.two_factor_pin = pin_input) THEN
        -- PIN correto - resetar tentativas e atualizar último login
        UPDATE profiles 
        SET pin_attempts = 0, 
            pin_locked_until = NULL,
            last_login = now()
        WHERE id = user_record.id;
        
        result := json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso',
            'user', json_build_object(
                'id', user_record.id,
                'full_name', user_record.full_name,
                'cpf', user_record.cpf,
                'role', user_record.role,
                'photo_url', user_record.photo_url,
                'has_pin', true,
                'tela_permitida', COALESCE(user_record.tela_permitida, 'dashboard'),
                'can_edit', COALESCE(user_record.can_edit, true)
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
        WHERE id = user_record.id;
        
        result := json_build_object(
            'success', false,
            'message', 'PIN incorreto',
            'attempts_remaining', 3 - (COALESCE(user_record.pin_attempts, 0) + 1)
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- Função para redefinir PIN (apenas para diretor e secretário)
CREATE OR REPLACE FUNCTION public.reset_user_pin_admin(target_cpf text, new_pin text, admin_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    admin_record RECORD;
    target_record RECORD;
    pin_hash TEXT;
    result JSON;
BEGIN
    -- Verificar se o usuário admin tem permissão
    SELECT * INTO admin_record 
    FROM profiles 
    WHERE id = admin_user_id;
    
    IF NOT FOUND OR admin_record.role NOT IN ('diretor', 'secretario') THEN
        result := json_build_object(
            'success', false,
            'error', 'Acesso negado. Apenas diretores e secretários podem redefinir PINs'
        );
        RETURN result;
    END IF;
    
    -- Limpar CPF
    target_cpf := REGEXP_REPLACE(target_cpf, '[^0-9]', '', 'g');
    
    -- Validar PIN (4 dígitos)
    IF new_pin !~ '^\d{4}$' THEN
        result := json_build_object(
            'success', false,
            'error', 'PIN deve conter exatamente 4 números'
        );
        RETURN result;
    END IF;
    
    -- Buscar usuário alvo por CPF
    SELECT * INTO target_record 
    FROM profiles 
    WHERE cpf = target_cpf;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
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
    WHERE id = target_record.id;
    
    -- Log da ação
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        admin_user_id,
        'PIN_RESET_BY_ADMIN',
        'profiles',
        target_record.id::text,
        json_build_object(
            'admin_name', admin_record.full_name,
            'target_name', target_record.full_name,
            'target_cpf', target_cpf
        )
    );
    
    result := json_build_object(
        'success', true,
        'message', 'PIN redefinido com sucesso para ' || target_record.full_name
    );
    
    RETURN result;
END;
$function$;

-- Função para verificar se é diretor ou secretário
CREATE OR REPLACE FUNCTION public.is_director_or_secretary()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    AND role IN ('diretor', 'secretario')
  );
$function$;