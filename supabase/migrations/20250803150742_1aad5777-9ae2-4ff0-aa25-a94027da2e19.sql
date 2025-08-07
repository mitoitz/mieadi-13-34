-- Limpar políticas conflitantes da tabela profiles e criar uma política simples
-- que permita ao diretor criar pessoas

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Allow public insert for signup" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow updates for authenticated users or admins" ON profiles;
DROP POLICY IF EXISTS "Allow deletes for admins" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and system can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Criar políticas simples e funcionais
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users" ON profiles FOR INSERT WITH CHECK (
  -- Permitir inserção se o usuário atual é admin/diretor/coordenador/secretario
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = get_current_authenticated_user() 
    AND p.role IN ('admin', 'diretor', 'coordenador', 'secretario')
  )
  OR 
  -- Ou se for uma inserção do sistema (durante signup)
  auth.uid() IS NULL
);

CREATE POLICY "Enable update for admin users" ON profiles FOR UPDATE USING (
  -- Permitir se é admin/diretor/coordenador/secretario
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = get_current_authenticated_user() 
    AND p.role IN ('admin', 'diretor', 'coordenador', 'secretario')
  )
  OR
  -- Ou se está atualizando o próprio perfil
  id = auth.uid()
);

CREATE POLICY "Enable delete for admin users" ON profiles FOR DELETE USING (
  -- Apenas admin/diretor/coordenador podem deletar
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = get_current_authenticated_user() 
    AND p.role IN ('admin', 'diretor', 'coordenador')
  )
);