-- Verificar e corrigir as políticas RLS da tabela attendances

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Students can view their own attendance" ON attendances;
DROP POLICY IF EXISTS "Teachers and admins can manage attendances" ON attendances;

-- Criar políticas mais simples e diretas para attendances
CREATE POLICY "Students can view their attendance"
ON attendances
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all attendances"
ON attendances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Teachers can manage attendances for their classes"
ON attendances
FOR ALL
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE professor_id = auth.uid()
  )
);

-- Verificar se RLS está habilitado
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;