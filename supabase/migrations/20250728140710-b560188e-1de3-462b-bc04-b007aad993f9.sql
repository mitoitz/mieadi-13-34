-- Criar política temporária para permitir inserção de frequências

-- Política para permitir inserção de frequências por usuários autenticados (temporária)
CREATE POLICY "Allow system to insert attendances"
ON attendances
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verificar se a função get_current_user_role existe
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(role::text, 'membro') FROM public.profiles WHERE id = auth.uid();
$$;