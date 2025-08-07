-- Corrigir política de inserção para permitir que professores insiram attendance para suas turmas
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendances;

-- Nova política mais específica
CREATE POLICY "Users can insert attendance appropriately" 
ON public.attendances 
FOR INSERT 
WITH CHECK (
  -- O próprio aluno pode inserir sua presença
  student_id = auth.uid() OR 
  -- Admins e coordenadores podem inserir qualquer presença
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  ) OR
  -- Professores podem inserir presença para alunos de suas turmas
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = attendances.class_id 
    AND professor_id = auth.uid()
  )
);