-- Verificar e ajustar políticas RLS para permitir operações de administradores
-- Primeiro, verificar as políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Remover políticas problemáticas se existirem
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Criar políticas mais flexíveis para INSERT
CREATE POLICY "Allow profile creation for authenticated users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Permitir inserção se é o próprio usuário autenticado via Supabase
  (id = auth.uid()) 
  OR 
  -- Permitir para administradores via função get_current_user_role
  (get_current_user_role() = 'admin') 
  OR
  -- Permitir para usuários com roles administrativos quando não há auth.uid()
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user() 
    AND role IN ('admin', 'coordenador', 'secretario')
  ))
);

-- Criar políticas mais flexíveis para UPDATE (já existe da migração anterior)
-- Apenas verificar se precisa ser atualizada
DROP POLICY IF EXISTS "Allow updates for authenticated users or admins" ON public.profiles;

CREATE POLICY "Allow updates for authenticated users or admins" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Permitir se é o próprio usuário autenticado via Supabase
  (id = auth.uid()) 
  OR 
  -- Permitir se é admin via função get_current_user_role
  (get_current_user_role() = 'admin') 
  OR
  -- Permitir para usuários com roles administrativos quando não há auth.uid()
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user() 
    AND role IN ('admin', 'coordenador', 'secretario')
  ))
);

-- Criar política mais flexível para DELETE (já existe da migração anterior)
-- Apenas verificar se precisa ser atualizada  
DROP POLICY IF EXISTS "Allow deletes for admins" ON public.profiles;

CREATE POLICY "Allow deletes for admins" 
ON public.profiles 
FOR DELETE 
USING (
  -- Permitir se é admin via função get_current_user_role
  (get_current_user_role() = 'admin') 
  OR
  -- Permitir para usuários com roles administrativos quando não há auth.uid()
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user() 
    AND role IN ('admin', 'coordenador', 'secretario')
  ))
);