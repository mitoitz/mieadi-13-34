-- Corrigir a função authenticate_by_email para melhor controle de permissões
CREATE OR REPLACE FUNCTION public.authenticate_by_email(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_record profiles%ROWTYPE;
    stored_password text;
BEGIN
    -- Buscar perfil do usuário
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Email não encontrado'
        );
    END IF;
    
    -- Verificar se o perfil pode fazer login por email (apenas perfis administrativos)
    IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'professor', 'pastor', 'secretario') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Este tipo de usuário não pode fazer login por email. Use login por PIN.'
        );
    END IF;
    
    -- Senhas para demonstração (em produção usar hash seguro)
    stored_password := CASE 
        WHEN profile_record.email = 'diretor@mieadi.com.br' THEN 'Diretor2025!'
        WHEN profile_record.email = 'admin@mieadi.com.br' THEN 'Admin2025!'
        WHEN profile_record.email = 'fernandobritosantana@gmail.com' THEN 'Fernando2025!'
        ELSE 'Admin2025!' -- senha padrão para outros perfis administrativos
    END;
    
    -- Verificar senha
    IF p_password != stored_password THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Senha incorreta'
        );
    END IF;
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = profile_record.id;
    
    -- Retornar sucesso com dados do usuário incluindo permissões baseadas no role
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
            'two_factor_enabled', profile_record.two_factor_enabled,
            'permissions', CASE profile_record.role
                WHEN 'diretor' THEN json_build_object(
                    'can_read', true,
                    'can_write', true,
                    'can_delete', true,
                    'can_manage_users', true,
                    'can_manage_courses', true,
                    'can_manage_classes', true,
                    'can_view_reports', true,
                    'can_manage_finances', true
                )
                WHEN 'admin' THEN json_build_object(
                    'can_read', true,
                    'can_write', true,
                    'can_delete', true,
                    'can_manage_users', true,
                    'can_manage_courses', true,
                    'can_manage_classes', true,
                    'can_view_reports', true,
                    'can_manage_finances', true
                )
                WHEN 'coordenador' THEN json_build_object(
                    'can_read', true,
                    'can_write', true,
                    'can_delete', false,
                    'can_manage_users', true,
                    'can_manage_courses', true,
                    'can_manage_classes', true,
                    'can_view_reports', true,
                    'can_manage_finances', false
                )
                WHEN 'secretario' THEN json_build_object(
                    'can_read', true,
                    'can_write', true,
                    'can_delete', false,
                    'can_manage_users', false,
                    'can_manage_courses', false,
                    'can_manage_classes', false,
                    'can_view_reports', true,
                    'can_manage_finances', true
                )
                WHEN 'professor' THEN json_build_object(
                    'can_read', true,
                    'can_write', false,
                    'can_delete', false,
                    'can_manage_users', false,
                    'can_manage_courses', false,
                    'can_manage_classes', false,
                    'can_view_reports', false,
                    'can_manage_finances', false
                )
                WHEN 'pastor' THEN json_build_object(
                    'can_read', true,
                    'can_write', false,
                    'can_delete', false,
                    'can_manage_users', false,
                    'can_manage_courses', false,
                    'can_manage_classes', false,
                    'can_view_reports', true,
                    'can_manage_finances', false
                )
                ELSE json_build_object(
                    'can_read', false,
                    'can_write', false,
                    'can_delete', false,
                    'can_manage_users', false,
                    'can_manage_courses', false,
                    'can_manage_classes', false,
                    'can_view_reports', false,
                    'can_manage_finances', false
                )
            END
        )
    );
END;
$function$;

-- Corrigir as policies da tabela profiles para melhor controle de permissões
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authentication operations" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins/coordinators can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile secure" ON profiles;
DROP POLICY IF EXISTS "Admins/coordinators can update profiles secure" ON profiles;
DROP POLICY IF EXISTS "Admins/coordinators can insert profiles secure" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles secure" ON profiles;

-- Criar policies mais claras e específicas
CREATE POLICY "Allow public read during authentication" ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (id = COALESCE(auth.uid(), get_current_authenticated_user()))
    WITH CHECK (id = COALESCE(auth.uid(), get_current_authenticated_user()));

CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role IN ('diretor', 'admin', 'coordenador')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role IN ('diretor', 'admin', 'coordenador')
    ));

CREATE POLICY "Secretaries can manage limited profiles" ON profiles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role = 'secretario'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role = 'secretario'
    ));

-- Função auxiliar para verificar permissões de edição
CREATE OR REPLACE FUNCTION public.can_edit_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_role text;
BEGIN
    current_user_id := COALESCE(auth.uid(), get_current_authenticated_user());
    
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Se é o próprio perfil, pode editar
    IF current_user_id = target_profile_id THEN
        RETURN true;
    END IF;
    
    -- Buscar role do usuário atual
    SELECT role INTO current_role
    FROM profiles 
    WHERE id = current_user_id;
    
    -- Verificar permissões por role
    RETURN current_role IN ('diretor', 'admin', 'coordenador', 'secretario');
END;
$function$;