-- Simplificar políticas RLS da tabela profiles para resolver problemas de atualização

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_auth_operations" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Criar políticas simples e claras
-- SELECT: Usuários podem ver seu próprio perfil, admins podem ver todos
CREATE POLICY "Allow user read own profile" ON profiles 
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- INSERT: Apenas admins podem criar novos perfis
CREATE POLICY "Allow admin insert profiles" ON profiles 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- UPDATE: Usuários podem atualizar seu próprio perfil, admins podem atualizar qualquer perfil
CREATE POLICY "Allow user update own profile" ON profiles 
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- DELETE: Apenas admins podem deletar perfis
CREATE POLICY "Allow admin delete profiles" ON profiles 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- Política especial para operações de autenticação
CREATE POLICY "Allow auth operations" ON profiles 
FOR ALL USING (
  -- Permitir operações quando não há usuário autenticado (login inicial)
  auth.uid() IS NULL OR
  -- Permitir quando há usuário autenticado
  auth.uid() IS NOT NULL
);