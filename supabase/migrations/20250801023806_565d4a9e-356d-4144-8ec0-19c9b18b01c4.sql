-- Corrigir política RLS da tabela courses que está bloqueando inserções
DROP POLICY IF EXISTS "Admins, coordinators and secretaries can manage courses" ON courses;

CREATE POLICY "Admins, coordinators and secretaries can manage courses" 
ON courses FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador', 'secretario')
  )
);

-- Corrigir política RLS da tabela enrollments que está causando recursão infinita
DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;

CREATE POLICY "Students can view their enrollments" 
ON enrollments FOR SELECT 
USING (
  student_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador', 'professor')
  )
);

-- Corrigir política de classes para permitir inserção
DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;

CREATE POLICY "Admins and coordinators can manage all classes" 
ON classes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador', 'professor')
  )
);

CREATE POLICY "Teachers can manage their own classes" 
ON classes FOR ALL 
USING (professor_id = auth.uid())
WITH CHECK (professor_id = auth.uid());