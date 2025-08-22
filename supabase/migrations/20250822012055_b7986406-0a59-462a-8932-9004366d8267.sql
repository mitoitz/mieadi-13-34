-- ===== LIMPEZA E REORGANIZAÇÃO DAS POLÍTICAS RLS DA TABELA PROFILES =====

-- Primeiro, remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Allow admin roles to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Secretaries can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Secretaries can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin roles to update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on own data" ON profiles;
DROP POLICY IF EXISTS "Secretaries can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- ===== POLÍTICAS SIMPLIFICADAS E ORGANIZADAS =====

-- 1. POLÍTICA DE LEITURA (SELECT)
-- Administradores podem ver todos os perfis, usuários comuns só o próprio
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
USING (
  -- Admins podem ver todos
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  ))
  OR
  -- Usuários podem ver seu próprio perfil
  (id = COALESCE(auth.uid(), get_current_authenticated_user()))
);

-- 2. POLÍTICA DE INSERÇÃO (INSERT)
-- Apenas administradores podem criar novos perfis
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- 3. POLÍTICA DE ATUALIZAÇÃO (UPDATE)
-- Administradores podem atualizar qualquer perfil, usuários só o próprio
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
USING (
  -- Admins podem atualizar qualquer perfil
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  ))
  OR
  -- Usuários podem atualizar seu próprio perfil
  (id = COALESCE(auth.uid(), get_current_authenticated_user()))
);

-- 4. POLÍTICA DE EXCLUSÃO (DELETE)
-- Apenas administradores podem excluir perfis
CREATE POLICY "profiles_delete_policy"
ON profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- ===== ADICIONAR POLÍTICA ESPECIAL PARA OPERAÇÕES DURANTE AUTENTICAÇÃO =====

-- Esta política permite operações durante o processo de autenticação
-- quando ainda não há auth.uid() mas há contexto válido
CREATE POLICY "profiles_auth_operations"
ON profiles
FOR ALL
USING (
  -- Permitir durante operações de autenticação
  is_authentication_operation() OR
  -- Operações por usuários do sistema
  COALESCE(auth.uid(), get_current_authenticated_user()) IS NOT NULL
)
WITH CHECK (
  -- Permitir durante operações de autenticação
  is_authentication_operation() OR
  -- Verificar permissões normais para outras operações
  COALESCE(auth.uid(), get_current_authenticated_user()) IS NOT NULL
);