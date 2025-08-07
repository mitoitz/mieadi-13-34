-- Primeiro, remover a política problemática da tabela courses
DROP POLICY IF EXISTS "Admins, coordinators and secretaries can manage courses" ON public.courses;

-- Criar função security definer para verificar permissões de gestão de cursos
CREATE OR REPLACE FUNCTION public.can_manage_courses()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  );
$$;

-- Recriar a política usando a função
CREATE POLICY "Admins, coordinators and secretaries can manage courses"
ON public.courses
FOR ALL
USING (can_manage_courses())
WITH CHECK (can_manage_courses());