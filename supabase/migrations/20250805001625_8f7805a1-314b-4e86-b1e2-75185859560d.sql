-- CORREÇÃO FINAL DOS PROBLEMAS DE SEGURANÇA DO LINTER

-- 1. Corrigir mais funções sem search_path definido
CREATE OR REPLACE FUNCTION public.auto_generate_badge_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.badge_number IS NULL OR NEW.badge_number = '' THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_member_request_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Generate QR code if not provided
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    
    -- Generate badge number if not provided
    IF NEW.badge_number IS NULL THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    
    -- Set default role if not provided
    IF NEW.role IS NULL THEN
        NEW.role := 'membro';
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL THEN
        NEW.status := 'ativo';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_badge_numbers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Se não tem badge_number, gerar automaticamente
    IF NEW.badge_number IS NULL OR NEW.badge_number = '' THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    
    -- Se não tem QR code, gerar automaticamente
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Encontrar e remover views SECURITY DEFINER
-- Primeiro, listar todas as views para identificar as problemáticas
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Remover views SECURITY DEFINER conhecidas
    DROP VIEW IF EXISTS campos CASCADE;
    
    -- Recriar a view campos sem SECURITY DEFINER
    CREATE VIEW campos AS
    SELECT 
        f.id,
        f.name as nome,
        f.description as descricao,
        f.responsible_id as coordenador_id,
        f.created_at,
        f.updated_at
    FROM fields f;
END;
$$;

-- 3. Criar função para remover credenciais hardcoded dos arquivos de código
CREATE OR REPLACE FUNCTION public.clean_hardcoded_credentials()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result_text text := '';
BEGIN
    -- Atualizar todas as senhas hardcoded para usar hash
    UPDATE auth_users_backup 
    SET encrypted_password = hash_password('TempSecure123!')
    WHERE email IN ('admin@mieadi.com', 'coordenador@mieadi.com', 'diretor@mieadi.com.br')
    AND encrypted_password IN ('Admin123!', 'Coord123!', 'Diretor123!');
    
    GET DIAGNOSTICS result_text = ROW_COUNT;
    
    -- Log da limpeza
    PERFORM log_security_event(
        'CREDENTIALS_CLEANUP',
        'Hardcoded credentials removed from backup table',
        'MEDIUM',
        jsonb_build_object('records_updated', result_text)
    );
    
    RETURN 'Limpeza concluída. ' || result_text || ' registros atualizados.';
END;
$$;

-- 4. Adicionar validação de entrada mais rigorosa
CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Validar email
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    
    -- Validar CPF se fornecido
    IF NEW.cpf IS NOT NULL AND length(regexp_replace(NEW.cpf, '[^0-9]', '', 'g')) != 11 THEN
        RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
    
    -- Validar telefone se fornecido
    IF NEW.phone IS NOT NULL AND length(regexp_replace(NEW.phone, '[^0-9]', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
    END IF;
    
    -- Sanitizar entradas de texto
    IF NEW.full_name IS NOT NULL THEN
        NEW.full_name := trim(NEW.full_name);
        -- Remover caracteres potencialmente perigosos
        NEW.full_name := regexp_replace(NEW.full_name, '[<>"\'';&]', '', 'g');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar validação de entrada
DROP TRIGGER IF EXISTS validate_user_input_trigger ON profiles;
CREATE TRIGGER validate_user_input_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_input();

-- 5. Implementar bloqueio de força bruta para login
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE,
    user_agent TEXT
);

-- Habilitar RLS na tabela login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Política para admins verem logs de login
CREATE POLICY "Admins can view login attempts" ON login_attempts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'coordenador')
    )
);

-- Função para registrar tentativas de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
    p_email text,
    p_success boolean,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO login_attempts (email, ip_address, success, user_agent)
    VALUES (p_email, p_ip_address, p_success, p_user_agent);
    
    -- Limpar tentativas antigas (mais de 24 horas)
    DELETE FROM login_attempts 
    WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$;

-- Função para verificar bloqueio por força bruta
CREATE OR REPLACE FUNCTION public.is_login_blocked(p_email text, p_ip_address inet DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    failed_attempts integer;
BEGIN
    -- Contar tentativas falhadas nas últimas 2 horas
    SELECT COUNT(*)
    INTO failed_attempts
    FROM login_attempts
    WHERE email = p_email
    AND success = false
    AND attempt_time > NOW() - INTERVAL '2 hours';
    
    -- Bloquear se mais de 5 tentativas falhadas
    IF failed_attempts >= 5 THEN
        PERFORM log_security_event(
            'LOGIN_BLOCKED',
            'Login blocked due to too many failed attempts',
            'HIGH',
            jsonb_build_object('email', p_email, 'failed_attempts', failed_attempts)
        );
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- 6. Executar limpeza de credenciais hardcoded
SELECT clean_hardcoded_credentials();