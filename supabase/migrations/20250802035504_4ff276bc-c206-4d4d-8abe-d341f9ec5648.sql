-- Atualizar política de UPDATE para permitir usuários autenticados localmente
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- Criar nova política mais flexível para UPDATE
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

-- Atualizar política de DELETE para ser mais flexível também
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;

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