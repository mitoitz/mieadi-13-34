-- Primeiro, remover as políticas problemáticas
DROP POLICY IF EXISTS "Secretários podem gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Pastores podem gerenciar membros" ON public.profiles;

-- Criar funções security definer para evitar recursão
CREATE OR REPLACE FUNCTION public.is_secretary()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'secretario'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pastor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'pastor'
  );
$$;

-- Recriar as políticas usando as funções
CREATE POLICY "Secretários podem gerenciar profiles"
ON public.profiles
FOR ALL
USING (is_secretary())
WITH CHECK (is_secretary());

CREATE POLICY "Pastores podem gerenciar membros"
ON public.profiles
FOR ALL
USING (is_pastor())
WITH CHECK (is_pastor());