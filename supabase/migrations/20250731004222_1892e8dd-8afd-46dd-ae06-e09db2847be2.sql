-- Corrigir políticas RLS da tabela attendances
-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Allow system to insert attendances" ON public.attendances;

-- Criar nova política mais permissiva para inserção
CREATE POLICY "Users can insert their own attendance" 
ON public.attendances 
FOR INSERT 
WITH CHECK (
  student_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role, 'professor'::user_role])
  )
);