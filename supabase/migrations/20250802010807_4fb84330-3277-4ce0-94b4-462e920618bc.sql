-- Corrigir políticas RLS para class_subjects
-- Permitir que admins e professores criem associações de disciplinas com turmas

-- Remover política antiga que pode estar causando problemas
DROP POLICY IF EXISTS "Admins and teachers can manage class subjects" ON class_subjects;
DROP POLICY IF EXISTS "Users can view class subjects for accessible classes" ON class_subjects;

-- Criar novas políticas mais permissivas para class_subjects
CREATE POLICY "Admins can manage all class subjects" 
ON class_subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user()
    AND role = 'admin'
  )
);

CREATE POLICY "Coordinators can manage class subjects" 
ON class_subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user()
    AND role = 'coordenador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = get_current_authenticated_user()
    AND role = 'coordenador'
  )
);

CREATE POLICY "Teachers can manage their class subjects" 
ON class_subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_subjects.class_id 
    AND classes.professor_id = get_current_authenticated_user()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_subjects.class_id 
    AND classes.professor_id = get_current_authenticated_user()
  )
);

CREATE POLICY "Users can view class subjects for their classes" 
ON class_subjects 
FOR SELECT 
USING (
  can_user_access_class(class_id)
);