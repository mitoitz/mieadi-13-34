-- Ativar RLS na tabela profiles se ainda não estiver ativo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que possam conflitar
DROP POLICY IF EXISTS "Allow admin roles to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin roles to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admin roles to update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON profiles;

-- Política para permitir que admin roles insiram perfis
CREATE POLICY "Allow admin roles to insert profiles"
ON profiles
FOR INSERT
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('diretor', 'secretario', 'coordenador')
);

-- Política para permitir que admin roles atualizem qualquer perfil
CREATE POLICY "Allow admin roles to update any profile"
ON profiles
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('diretor', 'secretario', 'coordenador')
);

-- Política para leitura: usuários podem ver o próprio perfil e admins podem ver todos
CREATE POLICY "Users can view their own profile and admins can view all"
ON profiles
FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('diretor', 'secretario', 'coordenador')
);

-- Política para permitir que usuários atualizem o próprio perfil
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);