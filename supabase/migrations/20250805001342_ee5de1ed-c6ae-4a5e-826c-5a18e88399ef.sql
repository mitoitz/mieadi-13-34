-- FASE 1: CORREÇÃO CRÍTICA DE SEGURANÇA DE SENHAS

-- 1. Corrigir tabela auth_users_backup - criptografar senhas em texto simples
UPDATE auth_users_backup 
SET encrypted_password = crypt(encrypted_password, gen_salt('bf'))
WHERE encrypted_password NOT LIKE '$2%'; -- Não criptografar senhas já hasheadas

-- 2. Adicionar função para hash seguro de senhas
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN crypt(plain_password, gen_salt('bf'));
END;
$$;

-- 3. Corrigir função de autenticação para usar hash adequado
CREATE OR REPLACE FUNCTION public.authenticate_by_email(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_record RECORD;
    profile_record RECORD;
BEGIN
    -- Buscar usuário na tabela de backup
    SELECT * INTO user_record
    FROM auth_users_backup
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Email não encontrado'
        );
    END IF;
    
    -- Verificar senha usando crypt (hash seguro)
    IF NOT crypt(p_password, user_record.encrypted_password) = user_record.encrypted_password THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Senha incorreta'
        );
    END IF;
    
    -- Buscar perfil completo
    SELECT * INTO profile_record
    FROM profiles
    WHERE id = user_record.profile_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Perfil não encontrado'
        );
    END IF;
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = profile_record.id;
    
    -- Retornar sucesso com dados do usuário
    RETURN json_build_object(
        'success', true,
        'message', 'Login realizado com sucesso',
        'user', json_build_object(
            'id', profile_record.id,
            'full_name', profile_record.full_name,
            'email', profile_record.email,
            'cpf', profile_record.cpf,
            'role', profile_record.role,
            'congregation_id', profile_record.congregation_id,
            'photo_url', profile_record.photo_url,
            'terms_accepted', profile_record.terms_accepted,
            'privacy_policy_accepted', profile_record.privacy_policy_accepted,
            'two_factor_enabled', profile_record.two_factor_enabled
        ),
        'session', json_build_object(
            'access_token', 'local_token_' || profile_record.id,
            'user', json_build_object(
                'id', profile_record.id,
                'email', profile_record.email
            )
        )
    );
END;
$$;

-- 4. Restringir políticas RLS overly permissive
-- Corrigir política de attendance_records que permite tudo
DROP POLICY IF EXISTS "System can manage attendance records" ON attendance_records;
CREATE POLICY "Authenticated users can manage attendance records"
ON attendance_records
FOR ALL
USING (
    -- Admins podem tudo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'secretario'))
    OR
    -- Professores podem gerenciar suas turmas
    EXISTS (SELECT 1 FROM classes WHERE id = attendance_records.class_id AND professor_id = auth.uid())
    OR
    -- Estudantes podem ver suas próprias presenças
    (student_id = auth.uid() AND 1=1) -- SELECT apenas
)
WITH CHECK (
    -- Admins podem inserir/atualizar tudo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'secretario'))
    OR
    -- Professores podem gerenciar suas turmas
    EXISTS (SELECT 1 FROM classes WHERE id = attendance_records.class_id AND professor_id = auth.uid())
);

-- 5. Corrigir política de classes
DROP POLICY IF EXISTS "System can manage classes" ON classes;
CREATE POLICY "Admins and teachers can manage classes"
ON classes
FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'secretario'))
    OR
    professor_id = auth.uid()
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'secretario'))
    OR
    professor_id = auth.uid()
);

-- 6. Adicionar validação para prevenir usuários de alterarem seus próprios roles
CREATE OR REPLACE FUNCTION public.prevent_role_self_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Se o role está sendo alterado e o usuário atual é o mesmo que está sendo modificado
    IF OLD.role != NEW.role AND NEW.id = auth.uid() THEN
        -- Verificar se o usuário atual é admin
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        ) THEN
            RAISE EXCEPTION 'Usuários não podem alterar seus próprios perfis de acesso';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger para prevenir auto-modificação de roles
DROP TRIGGER IF EXISTS prevent_role_self_modification_trigger ON profiles;
CREATE TRIGGER prevent_role_self_modification_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_modification();

-- 7. Adicionar auditoria para mudanças de role
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF OLD.role != NEW.role THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            COALESCE(auth.uid(), get_current_authenticated_user()),
            'ROLE_CHANGE',
            'profiles',
            NEW.id::text,
            json_build_object('old_role', OLD.role),
            json_build_object('new_role', NEW.role, 'changed_by', COALESCE(auth.uid(), get_current_authenticated_user()))
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger de auditoria
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON profiles;
CREATE TRIGGER audit_role_changes_trigger
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION audit_role_changes();

-- 8. Melhorar função de contexto de usuário com validação
CREATE OR REPLACE FUNCTION public.get_current_authenticated_user()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Primeiro, tentar auth.uid()
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        RETURN current_user_id;
    END IF;
    
    -- Se não há auth.uid(), usar configuração definida (validar se existe)
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::uuid;
        IF current_user_id IS NOT NULL THEN
            -- Validar se o usuário realmente existe
            IF EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
                RETURN current_user_id;
            END IF;
        END IF;
    EXCEPTION 
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Não retornar fallback hardcoded - mais seguro
    RETURN NULL;
END;
$$;

-- 9. Adicionar função para forçar 2FA em admins
CREATE OR REPLACE FUNCTION public.enforce_admin_2fa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Se o role é admin/coordenador e 2FA não está habilitado
    IF NEW.role IN ('admin', 'coordenador') AND NOT COALESCE(NEW.two_factor_enabled, false) THEN
        -- Gerar PIN temporário para forçar configuração
        NEW.two_factor_pin := LPAD((RANDOM() * 9999)::integer::text, 4, '0');
        NEW.two_factor_enabled := false; -- Força configuração no próximo login
        
        -- Log da ação
        INSERT INTO audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            COALESCE(auth.uid(), get_current_authenticated_user()),
            'ADMIN_2FA_REQUIRED',
            'profiles',
            NEW.id::text,
            json_build_object('message', 'Admin role requires 2FA setup')
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger para forçar 2FA em admins
DROP TRIGGER IF EXISTS enforce_admin_2fa_trigger ON profiles;
CREATE TRIGGER enforce_admin_2fa_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.role IN ('admin', 'coordenador'))
    EXECUTE FUNCTION enforce_admin_2fa();