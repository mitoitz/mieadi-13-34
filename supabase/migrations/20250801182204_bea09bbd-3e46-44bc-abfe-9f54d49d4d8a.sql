-- Corrigir recursão infinita nas políticas RLS da tabela profiles
-- Remover TODAS as políticas existentes da tabela profiles primeiro

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover todas as políticas da tabela profiles
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Recriar políticas sem recursão usando funções de segurança
-- Política simples para visualização própria
CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
USING (id = auth.uid());

-- Política para admins - sem recursão
CREATE POLICY "Admins view all profiles" 
ON profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Política para inserção (sistema)
CREATE POLICY "System can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização
CREATE POLICY "Users update own profile" 
ON profiles 
FOR UPDATE 
USING (id = auth.uid() OR get_current_user_role() = 'admin');

-- Política para deleção (só admins)
CREATE POLICY "Admins delete profiles" 
ON profiles 
FOR DELETE 
USING (get_current_user_role() = 'admin');