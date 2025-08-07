-- Corrigir políticas RLS da tabela classes para evitar recursão infinita

-- Remover as políticas existentes que estão causando recursão
DROP POLICY IF EXISTS "Students can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers and admins can manage classes" ON classes;

-- Criar políticas corrigidas sem recursão
CREATE POLICY "Students can view their enrolled classes"
ON classes
FOR SELECT
USING (
  id IN (
    SELECT class_id 
    FROM enrollments 
    WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view their assigned classes"
ON classes
FOR SELECT
USING (professor_id = auth.uid());

CREATE POLICY "Admins can view all classes"
ON classes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Admins can manage all classes"
ON classes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Teachers can manage their classes"
ON classes
FOR ALL
USING (professor_id = auth.uid());