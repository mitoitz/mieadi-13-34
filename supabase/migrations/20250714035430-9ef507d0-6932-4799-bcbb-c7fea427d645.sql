-- Criar tabelas básicas do sistema MIEADI

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

-- Inserir dados básicos
INSERT INTO congregations (name, address, city, state, pastor_name) VALUES
('Igreja Central', 'Rua Principal, 100', 'São Paulo', 'SP', 'Pastor João Silva'),
('Igreja Bela Vista', 'Av. Bela Vista, 250', 'São Paulo', 'SP', 'Pastor Pedro Santos'),
('Igreja Jardim Tropical', 'Rua das Flores, 50', 'São Paulo', 'SP', 'Pastor Marcos Lima');

INSERT INTO courses (name, description, duration_months, total_credits) VALUES
('Bacharel em Teologia', 'Curso superior de Teologia', 48, 180),
('Técnico em Teologia', 'Curso técnico de Teologia', 24, 90),
('Curso de Obreiros', 'Formação para obreiros', 12, 45);

INSERT INTO subjects (name, code, description, credits) VALUES
('Teologia Sistemática I', 'TS001', 'Introdução à Teologia Sistemática', 4),
('Hermenêutica Bíblica', 'HB001', 'Princípios de Interpretação Bíblica', 3),
('História da Igreja', 'HI001', 'História do Cristianismo', 3),
('Homilética', 'HOM001', 'Arte da Pregação', 2);