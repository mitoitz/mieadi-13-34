-- Criar estrutura completa do banco de dados MIEADI (sem duplicar types existentes)

-- Criação dos ENUMs (apenas os que não existem)
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ativo', 'inativo', 'pendente', 'trancado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pago', 'pendente', 'vencido', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'falta_justificada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('masculino', 'feminino');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE civil_status AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de Congregações
CREATE TABLE IF NOT EXISTS congregations (
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
CREATE TABLE IF NOT EXISTS fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  total_credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Disciplinas
CREATE TABLE IF NOT EXISTS subjects (
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS congregation_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_number TEXT;

-- Adicionar constraints depois das colunas
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT fk_congregation FOREIGN KEY (congregation_id) REFERENCES congregations(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT fk_field FOREIGN KEY (field_id) REFERENCES fields(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de Turmas
CREATE TABLE IF NOT EXISTS classes (
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
CREATE TABLE IF NOT EXISTS enrollments (
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
CREATE TABLE IF NOT EXISTS attendances (
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
CREATE TABLE IF NOT EXISTS grades (
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
CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS class_materials (
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
CREATE TABLE IF NOT EXISTS assessments (
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
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  points INTEGER DEFAULT 1,
  order_number INTEGER,
  options JSONB,
  correct_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Respostas dos Alunos
CREATE TABLE IF NOT EXISTS student_answers (
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

-- Usuários Admin pré-definidos (apenas se não existirem)
INSERT INTO profiles (
  id, 
  cpf, 
  full_name, 
  email, 
  role, 
  status, 
  is_first_login,
  created_at
) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  '048.160.543-50',
  'Administrador Master 1',
  'admin1@mieadi.com',
  'admin',
  'ativo',
  FALSE,
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE cpf = '048.160.543-50');

INSERT INTO profiles (
  id, 
  cpf, 
  full_name, 
  email, 
  role, 
  status, 
  is_first_login,
  created_at
) 
SELECT 
  '00000000-0000-0000-0000-000000000002',
  '046.241.473-67',
  'Administrador Master 2',
  'admin2@mieadi.com',
  'admin',
  'ativo',
  FALSE,
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE cpf = '046.241.473-67');

-- Inserir dados de exemplo
INSERT INTO congregations (name, address, city, state, pastor_name) 
SELECT 'Igreja Central', 'Rua Principal, 100', 'São Paulo', 'SP', 'Pastor João Silva'
WHERE NOT EXISTS (SELECT 1 FROM congregations WHERE name = 'Igreja Central');

INSERT INTO congregations (name, address, city, state, pastor_name) 
SELECT 'Igreja Bela Vista', 'Av. Bela Vista, 250', 'São Paulo', 'SP', 'Pastor Pedro Santos'
WHERE NOT EXISTS (SELECT 1 FROM congregations WHERE name = 'Igreja Bela Vista');

INSERT INTO congregations (name, address, city, state, pastor_name) 
SELECT 'Igreja Jardim Tropical', 'Rua das Flores, 50', 'São Paulo', 'SP', 'Pastor Marcos Lima'
WHERE NOT EXISTS (SELECT 1 FROM congregations WHERE name = 'Igreja Jardim Tropical');

INSERT INTO courses (name, description, duration_months, total_credits) 
SELECT 'Bacharel em Teologia', 'Curso superior de Teologia', 48, 180
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Bacharel em Teologia');

INSERT INTO courses (name, description, duration_months, total_credits) 
SELECT 'Técnico em Teologia', 'Curso técnico de Teologia', 24, 90
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Técnico em Teologia');

INSERT INTO courses (name, description, duration_months, total_credits) 
SELECT 'Curso de Obreiros', 'Formação para obreiros', 12, 45
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Curso de Obreiros');

INSERT INTO subjects (name, code, description, credits) 
SELECT 'Teologia Sistemática I', 'TS001', 'Introdução à Teologia Sistemática', 4
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'TS001');

INSERT INTO subjects (name, code, description, credits) 
SELECT 'Hermenêutica Bíblica', 'HB001', 'Princípios de Interpretação Bíblica', 3
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'HB001');

INSERT INTO subjects (name, code, description, credits) 
SELECT 'História da Igreja', 'HI001', 'História do Cristianismo', 3
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'HI001');

INSERT INTO subjects (name, code, description, credits) 
SELECT 'Homilética', 'HOM001', 'Arte da Pregação', 2
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE code = 'HOM001');