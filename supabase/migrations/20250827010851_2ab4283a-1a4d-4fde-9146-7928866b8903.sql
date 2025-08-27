-- Adicionar políticas RLS para super_admins
CREATE POLICY "Super admins can view all super_admins" 
ON public.super_admins 
FOR SELECT 
USING (is_super_admin(auth.uid()) OR is_admin_or_coordinator());

-- Política para super admins gerenciarem registros
CREATE POLICY "Super admins can manage super_admins" 
ON public.super_admins 
FOR ALL 
USING (is_super_admin(auth.uid()) OR is_admin_or_coordinator())
WITH CHECK (is_super_admin(auth.uid()) OR is_admin_or_coordinator());

-- Função para adicionar super admin por CPF
CREATE OR REPLACE FUNCTION add_super_admin(target_cpf TEXT, granted_by_id UUID DEFAULT NULL, admin_notes TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Limpar CPF
    target_cpf := REGEXP_REPLACE(target_cpf, '[^0-9]', '', 'g');
    
    -- Buscar usuário pelo CPF
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE cpf = target_cpf AND status = 'ativo';
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF não encontrado ou usuário inativo'
        );
    END IF;
    
    -- Verificar se já é super admin
    IF is_super_admin(target_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Este usuário já é um Super Administrador'
        );
    END IF;
    
    -- Adicionar como super admin
    INSERT INTO super_admins (user_id, cpf, granted_by, notes)
    VALUES (target_user_id, target_cpf, granted_by_id, admin_notes);
    
    -- Atualizar role do usuário para diretor se necessário
    UPDATE profiles 
    SET role = 'diretor',
        can_edit = true,
        updated_at = now()
    WHERE id = target_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Super Administrador adicionado com sucesso',
        'user_id', target_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erro ao adicionar Super Administrador: ' || SQLERRM
        );
END;
$$;

-- Função para remover super admin
CREATE OR REPLACE FUNCTION remove_super_admin(target_cpf TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Limpar CPF
    target_cpf := REGEXP_REPLACE(target_cpf, '[^0-9]', '', 'g');
    
    -- Buscar usuário pelo CPF
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE cpf = target_cpf;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF não encontrado'
        );
    END IF;
    
    -- Remover da tabela super_admins
    UPDATE super_admins 
    SET active = false,
        updated_at = now()
    WHERE user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Este usuário não é um Super Administrador'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Super Administrador removido com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erro ao remover Super Administrador: ' || SQLERRM
        );
END;
$$;

-- Função para listar super admins
CREATE OR REPLACE FUNCTION list_super_admins()
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    cpf TEXT,
    email TEXT,
    role TEXT,
    granted_at TIMESTAMP WITH TIME ZONE,
    granted_by_name TEXT,
    active BOOLEAN,
    notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        p.full_name,
        sa.cpf,
        p.email,
        p.role::TEXT,
        sa.granted_at,
        gb.full_name as granted_by_name,
        sa.active,
        sa.notes
    FROM super_admins sa
    JOIN profiles p ON sa.user_id = p.id
    LEFT JOIN profiles gb ON sa.granted_by = gb.id
    ORDER BY sa.granted_at DESC;
END;
$$;