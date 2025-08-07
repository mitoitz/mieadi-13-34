-- Criar todas as tabelas necessárias para completar o sistema MIEADI

-- Tabela de Campos/Setores
CREATE TABLE IF NOT EXISTS fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Turmas/Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  professor_id UUID REFERENCES profiles(id),
  congregation_id UUID REFERENCES congregations(id),
  start_date DATE,
  end_date DATE,
  schedule TEXT, -- JSON ou texto com horários
  max_students INTEGER DEFAULT 30,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Matrículas
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  course_id UUID REFERENCES courses(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'ativa',
  final_grade DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Tabela de Frequência
CREATE TABLE IF NOT EXISTS attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL,
  status TEXT DEFAULT 'presente', -- presente, ausente, justificado
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Tabela de Notas
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  assessment_type TEXT NOT NULL, -- prova, trabalho, participacao
  grade DECIMAL(4,2) NOT NULL,
  max_grade DECIMAL(4,2) DEFAULT 10.00,
  weight DECIMAL(3,2) DEFAULT 1.00,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Materiais da Aula
CREATE TABLE IF NOT EXISTS class_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'prova', -- prova, trabalho, quiz
  total_points DECIMAL(5,2) DEFAULT 100.00,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Questões das Avaliações
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false, essay
  options JSONB, -- Para questões de múltipla escolha
  correct_answer TEXT,
  points DECIMAL(4,2) DEFAULT 1.00,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Respostas dos Alunos
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  assessment_id UUID REFERENCES assessments(id),
  question_id UUID REFERENCES assessment_questions(id),
  answer_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  points_earned DECIMAL(4,2) DEFAULT 0.00,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, question_id)
);

-- Atualizar tabela profiles com novos campos necessários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS congregation_id UUID REFERENCES congregations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS civil_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level TEXT;

-- Habilitar RLS em todas as tabelas
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Fields
CREATE POLICY "Admins and coordenadores can manage fields" ON fields FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Everyone can view fields" ON fields FOR SELECT USING (true);

-- Políticas RLS para Classes
CREATE POLICY "Teachers and admins can manage classes" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);
CREATE POLICY "Students can view their classes" ON classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE class_id = classes.id AND student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Políticas RLS para Enrollments
CREATE POLICY "Admins can manage all enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view their own enrollments" ON enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view enrollments in their classes" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes WHERE id = enrollments.class_id AND professor_id = auth.uid())
);

-- Políticas RLS para Attendances
CREATE POLICY "Teachers and admins can manage attendances" ON attendances FOR ALL USING (
  EXISTS (SELECT 1 FROM classes WHERE id = attendances.class_id AND professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view their own attendance" ON attendances FOR SELECT USING (student_id = auth.uid());

-- Políticas RLS para Grades
CREATE POLICY "Teachers and admins can manage grades" ON grades FOR ALL USING (
  EXISTS (SELECT 1 FROM classes WHERE id = grades.class_id AND professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view their own grades" ON grades FOR SELECT USING (student_id = auth.uid());

-- Políticas RLS para Payments
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view their own payments" ON payments FOR SELECT USING (student_id = auth.uid());

-- Políticas RLS para Class Materials
CREATE POLICY "Teachers and admins can manage class materials" ON class_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM classes WHERE id = class_materials.class_id AND professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view materials from their classes" ON class_materials FOR SELECT USING (
  is_public = true 
  OR EXISTS (SELECT 1 FROM enrollments WHERE class_id = class_materials.class_id AND student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Políticas RLS para Assessments
CREATE POLICY "Teachers and admins can manage assessments" ON assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM classes WHERE id = assessments.class_id AND professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view published assessments from their classes" ON assessments FOR SELECT USING (
  is_published = true 
  AND EXISTS (SELECT 1 FROM enrollments WHERE class_id = assessments.class_id AND student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Políticas RLS para Assessment Questions
CREATE POLICY "Teachers and admins can manage assessment questions" ON assessment_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM assessments a JOIN classes c ON a.class_id = c.id 
          WHERE a.id = assessment_questions.assessment_id AND c.professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);
CREATE POLICY "Students can view questions from published assessments" ON assessment_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessments a JOIN enrollments e ON a.class_id = e.class_id 
          WHERE a.id = assessment_questions.assessment_id AND a.is_published = true AND e.student_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador', 'professor'))
);

-- Políticas RLS para Student Answers
CREATE POLICY "Students can manage their own answers" ON student_answers FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers can view answers from their assessments" ON student_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM assessments a JOIN classes c ON a.class_id = c.id 
          WHERE a.id = student_answers.assessment_id AND c.professor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenador'))
);

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_materials_updated_at BEFORE UPDATE ON class_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON assessment_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_answers_updated_at BEFORE UPDATE ON student_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais para campos
INSERT INTO fields (name, description) VALUES
('Secretaria', 'Departamento administrativo'),
('Ensino', 'Departamento de educação'),
('Tesouraria', 'Departamento financeiro'),
('Biblioteca', 'Gestão de materiais e recursos')
ON CONFLICT DO NOTHING;