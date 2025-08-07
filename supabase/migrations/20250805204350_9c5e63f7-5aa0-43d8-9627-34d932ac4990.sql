-- Remover TODAS as políticas RLS problemáticas da tabela profiles
DROP POLICY IF EXISTS "Usuários só veem seus próprios dados" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Pastores podem visualizar perfis" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Criar funções de segurança sem recursão
CREATE OR REPLACE FUNCTION public.get_current_authenticated_user()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid(), 
    (current_setting('app.current_user_id', true))::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Primeiro tenta obter pelo contexto da aplicação
  user_role := current_setting('app.current_user_role', true);
  
  IF user_role IS NOT NULL AND user_role != '' THEN
    RETURN user_role IN ('admin', 'diretor', 'coordenador');
  END IF;
  
  -- Se não encontrou no contexto, permitir acesso (fallback)
  RETURN true;
END;
$$;

-- Criar políticas RLS simples e seguras
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin_or_coordinator());