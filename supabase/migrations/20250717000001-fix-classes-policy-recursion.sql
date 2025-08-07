-- Corrigir recursão infinita na política RLS da tabela classes

-- Remover política problemática
DROP POLICY IF EXISTS "Students can view their classes" ON classes;
DROP POLICY IF EXISTS "Teachers and admins can manage classes" ON classes;

-- Recriar política sem recursão
CREATE POLICY "Teachers and admins can manage classes" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Política simplificada para estudantes visualizarem turmas
CREATE POLICY "Students can view classes they are enrolled in" ON classes FOR SELECT USING (
  -- Permitir acesso direto sem subquery recursiva
  id IN (
    SELECT class_id FROM enrollments WHERE student_id = auth.uid()
  )
  OR 
  -- Permitir acesso para admins, coordenadores e professores
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Garantir que a política de enrollments também esteja correta
DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON enrollments;

-- Recriar política de enrollments sem referência circular
CREATE POLICY "Teachers can view enrollments in their classes" ON enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM classes c 
    JOIN profiles p ON c.professor_id = p.id 
    WHERE c.id = enrollments.class_id 
    AND p.id = auth.uid()
  )
);