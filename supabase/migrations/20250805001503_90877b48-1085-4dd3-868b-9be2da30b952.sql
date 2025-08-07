-- CORREÇÃO DOS PROBLEMAS CRÍTICOS DO LINTER DE SEGURANÇA

-- 1. Corrigir views SECURITY DEFINER problemáticas
-- Remover/recriar views sem SECURITY DEFINER se existirem
DROP VIEW IF EXISTS attendance_summary CASCADE;

-- 2. Corrigir funções sem search_path definido
-- Lista das funções que precisam de search_path corrigido:

CREATE OR REPLACE FUNCTION public.auto_generate_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_subject_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_subject_code();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_certificate_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Gerar número do certificado se não fornecido
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := generate_certificate_number();
    END IF;
    
    -- Gerar código de validação se não fornecido
    IF NEW.validation_code IS NULL THEN
        NEW.validation_code := generate_validation_code();
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_two_factor_pin(user_id uuid, new_pin character varying)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    UPDATE profiles 
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

CREATE OR REPLACE FUNCTION public.accept_terms_and_privacy(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE profiles 
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

CREATE OR REPLACE FUNCTION public.verify_two_factor_pin(user_id uuid, pin_input character varying)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    -- Resetar tentativas expiradas
    PERFORM reset_pin_attempts_if_expired(user_id);
    
    -- Buscar perfil
    SELECT * INTO profile_record 
    FROM profiles 
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
        UPDATE profiles 
        SET pin_attempts = 0, pin_locked_until = NULL
        WHERE id = user_id;
        
        result := json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso'
        );
    ELSE
        -- PIN incorreto - incrementar tentativas
        UPDATE profiles 
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

CREATE OR REPLACE FUNCTION public.create_supabase_auth_for_profile(user_email text, user_password text DEFAULT 'Admin@2025'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Get the profile
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User not found in profiles table'
    );
  END IF;
  
  -- Check if user can use email login
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'secretario', 'professor') THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User role cannot use email login'
    );
  END IF;
  
  -- Set profile prepared for Supabase Auth
  UPDATE profiles 
  SET 
    password_hash = crypt(user_password, gen_salt('bf')),
    first_login = false,
    last_password_change = NOW(),
    email_confirmed_at = NOW()
  WHERE id = profile_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Profile prepared for Supabase Auth. Password set to: ' || user_password,
    'user_id', profile_record.id,
    'email', profile_record.email,
    'password', user_password
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error preparing auth account: ' || SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_director_auth_user()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  director_id UUID := '2105fb66-4072-4676-846d-bfb8dbe8734a';
  director_email TEXT := 'diretor@mieadi.com.br';
  director_password TEXT := 'Diretor123!';
  salt TEXT;
  password_hash TEXT;
BEGIN
  -- Gerar salt e hash da senha
  salt := gen_salt('bf');
  password_hash := crypt(director_password, salt);
  
  -- Tentar inserir o usuário no auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      director_id,
      'authenticated',
      'authenticated',
      director_email,
      password_hash,
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'full_name', 'MAURO ARRUDA DE ARRUDA',
        'role', 'diretor'
      ),
      false,
      '',
      '',
      '',
      ''
    );
    
    -- Criar identity
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      director_id,
      jsonb_build_object(
        'sub', director_id::text,
        'email', director_email
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
    RETURN 'Usuário criado com sucesso: ' || director_email || ' / ' || director_password;
    
  EXCEPTION WHEN others THEN
    -- Se já existe, tentar atualizar a senha
    UPDATE auth.users 
    SET encrypted_password = password_hash,
        updated_at = NOW()
    WHERE id = director_id;
    
    RETURN 'Usuário já existe, senha atualizada: ' || director_email || ' / ' || director_password;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_auth_users_from_profiles()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    admin_record RECORD;
    result_text text := '';
BEGIN
    -- Inserir usuários administrativos na tabela auth.users simulada
    -- Como não podemos acessar auth.users diretamente, vamos garantir que o backup esteja atualizado
    
    -- Limpar backup existente para recriação
    DELETE FROM auth_users_backup;
    
    -- Inserir administradores com senhas hash corretas
    FOR admin_record IN 
        SELECT id, full_name, email, cpf, role 
        FROM profiles 
        WHERE role IN ('admin', 'coordenador', 'professor', 'secretario') 
        AND email IS NOT NULL AND email != ''
    LOOP
        INSERT INTO auth_users_backup (
            profile_id,
            email,
            encrypted_password, -- Senha "mudar123" já hashada
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            admin_record.id,
            admin_record.email,
            hash_password('mudar123'), -- Usar função segura de hash
            now(),
            now(),
            now(),
            jsonb_build_object(
                'full_name', admin_record.full_name,
                'cpf', admin_record.cpf,
                'role', admin_record.role
            )
        );
        
        result_text := result_text || 'Usuário criado: ' || admin_record.email || E'\n';
    END LOOP;
    
    RETURN result_text;
END;
$$;

-- 3. Recriar view attendance_summary de forma mais segura (sem SECURITY DEFINER)
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    ar.id,
    ar.student_id,
    ar.class_id,
    ar.event_id,
    ar.check_in_time,
    ar.check_out_time,
    ar.status,
    ar.attendance_type,
    ar.verification_method,
    ar.created_at,
    p.full_name as student_name,
    p.cpf as student_cpf,
    p.badge_number,
    c.name as class_name,
    e.title as event_title
FROM attendance_records ar
LEFT JOIN profiles p ON ar.student_id = p.id
LEFT JOIN classes c ON ar.class_id = c.id
LEFT JOIN events e ON ar.event_id = e.id;

-- 4. Adicionar políticas RLS mais rigorosas para proteger dados sensíveis
CREATE POLICY "Enhanced security for sensitive data" ON profiles
FOR SELECT
USING (
    -- Usuário pode ver seu próprio perfil
    id = auth.uid()
    OR
    -- Admins podem ver todos os perfis
    EXISTS (
        SELECT 1 FROM profiles p2 
        WHERE p2.id = auth.uid() 
        AND p2.role IN ('admin', 'coordenador', 'secretario')
    )
    OR
    -- Professores podem ver perfis de seus alunos
    EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        WHERE e.student_id = profiles.id
        AND c.professor_id = auth.uid()
    )
);

-- 5. Adicionar função para logs de segurança detalhados
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type text,
    event_description text,
    risk_level text DEFAULT 'LOW',
    additional_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        COALESCE(auth.uid(), get_current_authenticated_user()),
        'SECURITY_EVENT',
        'security_log',
        gen_random_uuid()::text,
        jsonb_build_object(
            'event_type', event_type,
            'description', event_description,
            'risk_level', risk_level,
            'timestamp', now(),
            'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
            'ip_address', current_setting('request.headers', true)::jsonb->>'x-real-ip',
            'additional_data', additional_data
        )
    );
END;
$$;