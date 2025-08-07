-- Criar tabela de notas/avaliações
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade_value DECIMAL(3,1) NOT NULL CHECK (grade_value >= 0 AND grade_value <= 10),
  assessment_type VARCHAR(20) NOT NULL DEFAULT 'prova' CHECK (assessment_type IN ('prova', 'trabalho', 'participacao', 'seminario', 'atividade')),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight > 0),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_date ON grades(assessment_date);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_grades_updated_at();

-- Políticas RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar notas das suas turmas
CREATE POLICY "Teachers can manage grades for their classes" ON grades FOR ALL USING (
  teacher_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

-- Alunos podem ver suas próprias notas
CREATE POLICY "Students can view their own grades" ON grades FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Criar tabela de materiais didáticos
CREATE TABLE IF NOT EXISTS class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  file_size INTEGER,
  material_type VARCHAR(20) NOT NULL DEFAULT 'documento' CHECK (material_type IN ('documento', 'video', 'audio', 'imagem', 'link', 'outros')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para materiais
CREATE INDEX IF NOT EXISTS idx_class_materials_class_id ON class_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_teacher_id ON class_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_materials_type ON class_materials(material_type);

-- Trigger para updated_at dos materiais
CREATE TRIGGER trigger_class_materials_updated_at
  BEFORE UPDATE ON class_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_grades_updated_at();

-- Políticas RLS para materiais
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar materiais das suas turmas
CREATE POLICY "Teachers can manage materials for their classes" ON class_materials FOR ALL USING (
  teacher_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

-- Alunos podem ver materiais das turmas em que estão matriculados
CREATE POLICY "Students can view materials from their classes" ON class_materials FOR SELECT USING (
  class_id IN (
    SELECT class_id FROM enrollments WHERE student_id = auth.uid() AND status = 'active'
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);