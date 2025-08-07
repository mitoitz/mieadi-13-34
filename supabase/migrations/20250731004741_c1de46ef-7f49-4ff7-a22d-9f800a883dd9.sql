-- Atualizar política para incluir secretário também
DROP POLICY IF EXISTS "Users can insert attendance appropriately" ON public.attendances;

-- Nova política incluindo secretário
CREATE POLICY "Users can insert attendance appropriately" 
ON public.attendances 
FOR INSERT 
WITH CHECK (
  -- O próprio aluno pode inserir sua presença
  student_id = auth.uid() OR 
  -- Admins, coordenadores e secretários podem inserir qualquer presença
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role, 'secretario'::user_role])
  ) OR
  -- Professores podem inserir presença para alunos de suas turmas
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = attendances.class_id 
    AND professor_id = auth.uid()
  )
);