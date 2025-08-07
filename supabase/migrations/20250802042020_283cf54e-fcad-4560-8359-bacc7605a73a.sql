-- Corrigir políticas RLS da tabela profiles para permitir acesso completo a administradores
-- Remover políticas existentes problemáticas
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Política para SELECT: Todos podem ver perfis
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

-- Política para INSERT: Administradores e sistema podem criar perfis
CREATE POLICY "Admins and system can create profiles"
ON profiles FOR INSERT
WITH CHECK (
  -- Permitir se for admin/coordenador/secretario via auth.uid()
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )) OR
  -- Permitir se for admin/coordenador/secretario via contexto local
  (get_current_user_role() IN ('admin', 'coordenador', 'secretario')) OR
  -- Permitir inserção sem usuário autenticado (para setup inicial)
  (auth.uid() IS NULL)
);

-- Política para UPDATE: Administradores podem atualizar qualquer perfil
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  -- Permitir se for admin/coordenador/secretario via auth.uid()
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )) OR
  -- Permitir se for admin/coordenador/secretario via contexto local
  (get_current_user_role() IN ('admin', 'coordenador', 'secretario')) OR
  -- Permitir que usuário atualize próprio perfil
  (id = auth.uid())
);

-- Política para DELETE: Apenas administradores podem deletar perfis
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  -- Permitir se for admin/coordenador via auth.uid()
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )) OR
  -- Permitir se for admin/coordenador via contexto local
  (get_current_user_role() IN ('admin', 'coordenador'))
);

-- Melhorar função search_people para ser mais permissiva
CREATE OR REPLACE FUNCTION public.search_people(search_term text)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  cpf text, 
  email text, 
  phone text, 
  role user_role, 
  status user_status, 
  qr_code text, 
  badge_number text, 
  photo_url text, 
  congregation_name text, 
  field_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Retornar todas as pessoas independente de autenticação
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.cpf,
        p.email,
        p.phone,
        p.role,
        p.status,
        p.qr_code,
        p.badge_number,
        p.photo_url,
        c.name AS congregation_name,
        f.name AS field_name
    FROM profiles p
    LEFT JOIN congregations c ON p.congregation_id = c.id
    LEFT JOIN fields f ON p.field_id = f.id
    WHERE 
        (search_term = '' OR search_term IS NULL) OR
        (p.full_name ILIKE '%' || search_term || '%') OR
        (p.cpf ILIKE '%' || search_term || '%') OR
        (p.email ILIKE '%' || search_term || '%') OR
        (p.qr_code ILIKE '%' || search_term || '%') OR
        (p.badge_number ILIKE '%' || search_term || '%')
    ORDER BY p.full_name;
END;
$function$;