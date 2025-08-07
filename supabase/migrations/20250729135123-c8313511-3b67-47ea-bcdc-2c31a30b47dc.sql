-- Corrigir recursão infinita nas políticas RLS da tabela classes
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins and coordinators can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Admins and coordinators can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view assigned classes" ON public.classes;

-- Criar função para verificar se usuário pode ver turma (sem recursão)
CREATE OR REPLACE FUNCTION public.can_user_access_class(class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    -- Admin/coordenador pode ver todas
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  ) OR EXISTS (
    -- Professor pode ver suas turmas
    SELECT 1 FROM public.classes 
    WHERE id = class_id 
    AND professor_id = auth.uid()
  ) OR EXISTS (
    -- Estudante pode ver turmas onde está matriculado
    SELECT 1 FROM public.enrollments 
    WHERE class_id = class_id 
    AND student_id = auth.uid()
  );
$$;

-- Recrear políticas sem recursão
CREATE POLICY "Users can view accessible classes" 
ON public.classes 
FOR SELECT 
USING (public.can_user_access_class(id));

CREATE POLICY "Admins and coordinators can manage classes" 
ON public.classes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Teachers can manage their classes" 
ON public.classes 
FOR ALL 
USING (professor_id = auth.uid())
WITH CHECK (professor_id = auth.uid());

-- Corrigir política da tabela enrollments também
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON public.enrollments;

CREATE POLICY "Users can view their enrollments" 
ON public.enrollments 
FOR SELECT 
USING (
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = enrollments.class_id 
    AND professor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage enrollments" 
ON public.enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);