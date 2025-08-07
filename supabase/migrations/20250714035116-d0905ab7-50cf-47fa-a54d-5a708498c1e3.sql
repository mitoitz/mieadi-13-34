-- Criar estrutura completa do banco de dados MIEADI

-- Criação dos ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'coordenador', 'secretario', 'professor', 'aluno', 'membro', 'pastor');
CREATE TYPE user_status AS ENUM ('ativo', 'inativo', 'pendente', 'trancado');
CREATE TYPE payment_status AS ENUM ('pago', 'pendente', 'vencido', 'cancelado');
CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'falta_justificada');
CREATE TYPE gender AS ENUM ('masculino', 'feminino');
CREATE TYPE civil_status AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo');

-- Tabela de Congregações
CREATE TABLE congregations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  pastor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Campos
CREATE TABLE fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Cursos
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  total_credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Disciplinas
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  credits INTEGER DEFAULT 0,
  course_id UUID REFERENCES courses(id),
  professor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela atualizada de Profiles com campos completos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender gender;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS civil_status civil_status;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS congregation_id UUID REFERENCES congregations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_number TEXT UNIQUE;

-- Tabela de Turmas
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  professor_id UUID REFERENCES profiles(id),
  year INTEGER,
  semester INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Matrículas
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status user_status DEFAULT 'ativo',
  final_grade DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Tabela de Frequência
CREATE TABLE attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  class_date DATE NOT NULL,
  status attendance_status DEFAULT 'ausente',
  justification TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(enrollment_id, class_date)
);

-- Tabela de Notas/Avaliações
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  assessment_name TEXT NOT NULL,
  grade DECIMAL(4,2) NOT NULL,
  max_grade DECIMAL(4,2) DEFAULT 10.00,
  weight DECIMAL(3,2) DEFAULT 1.00,
  assessment_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Pagamentos
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status payment_status DEFAULT 'pendente',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Materiais de Aula
CREATE TABLE class_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Avaliações/Provas
CREATE TABLE assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT,
  total_points INTEGER DEFAULT 100,
  duration_minutes INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Questões das Avaliações
CREATE TABLE assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  points INTEGER DEFAULT 1,
  order_number INTEGER,
  options JSONB, -- Para questões de múltipla escolha
  correct_answer TEXT, -- Para questões objetivas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Respostas dos Alunos
CREATE TABLE student_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES assessment_questions(id),
  student_id UUID REFERENCES profiles(id),
  answer_text TEXT,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(question_id, student_id)
);

-- Usuários Admin pré-definidos
INSERT INTO profiles (
  id, 
  cpf, 
  full_name, 
  email, 
  role, 
  status, 
  is_first_login,
  created_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  '048.160.543-50',
  'Administrador Master 1',
  'admin1@mieadi.com',
  'admin',
  'ativo',
  FALSE,
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  '046.241.473-67',
  'Administrador Master 2',
  'admin2@mieadi.com',
  'admin',
  'ativo',
  FALSE,
  now()
);

-- Inserir dados de exemplo para Congregações
INSERT INTO congregations (name, address, city, state, pastor_name) VALUES
('Igreja Central', 'Rua Principal, 100', 'São Paulo', 'SP', 'Pastor João Silva'),
('Igreja Bela Vista', 'Av. Bela Vista, 250', 'São Paulo', 'SP', 'Pastor Pedro Santos'),
('Igreja Jardim Tropical', 'Rua das Flores, 50', 'São Paulo', 'SP', 'Pastor Marcos Lima');

-- Inserir dados de exemplo para Cursos
INSERT INTO courses (name, description, duration_months, total_credits) VALUES
('Bacharel em Teologia', 'Curso superior de Teologia', 48, 180),
('Técnico em Teologia', 'Curso técnico de Teologia', 24, 90),
('Curso de Obreiros', 'Formação para obreiros', 12, 45);

-- Inserir dados de exemplo para Disciplinas
INSERT INTO subjects (name, code, description, credits) VALUES
('Teologia Sistemática I', 'TS001', 'Introdução à Teologia Sistemática', 4),
('Hermenêutica Bíblica', 'HB001', 'Princípios de Interpretação Bíblica', 3),
('História da Igreja', 'HI001', 'História do Cristianismo', 3),
('Homilética', 'HOM001', 'Arte da Pregação', 2);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE congregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (admins podem tudo)
CREATE POLICY "Admins can manage congregations" ON congregations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage fields" ON fields FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage courses" ON courses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Teachers and admins can manage classes" ON classes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their enrollments" ON enrollments FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their attendances" ON attendances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = attendances.enrollment_id AND enrollments.student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their grades" ON grades FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = grades.enrollment_id AND enrollments.student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their payments" ON payments FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

-- Triggers para updated_at
CREATE TRIGGER update_congregations_updated_at BEFORE UPDATE ON congregations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_materials_updated_at BEFORE UPDATE ON class_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON assessment_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();