-- Corrigir recursão infinita nas políticas RLS da tabela profiles
-- O problema está nas políticas que referenciam a própria tabela profiles

-- Remover políticas problemáticas da tabela profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recriar políticas sem recursão
-- Política simples para visualização própria
CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
USING (id = auth.uid());

-- Política para admins - usando a função atualizada sem recursão
CREATE POLICY "Admins view all profiles" 
ON profiles 
FOR SELECT 
USING (
  -- Verificação direta do CPF admin sem usar auth.uid()
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.cpf = '04816954350' 
    AND p.role = 'admin'
  ) OR
  -- Para sessões Supabase normais
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'coordenador')
  )
);

-- Política para inserção (sistema e admins)
CREATE POLICY "System can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Users update own profile" 
ON profiles 
FOR UPDATE 
USING (
  id = auth.uid() OR 
  -- Admin direto por CPF
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.cpf = '04816954350' 
    AND p.role = 'admin'
  )
);

-- Política para deleção (só admins)
CREATE POLICY "Admins delete profiles" 
ON profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.cpf = '04816954350' 
    AND p.role = 'admin'
  )
);