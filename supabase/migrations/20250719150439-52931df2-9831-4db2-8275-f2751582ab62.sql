-- Criação de tabelas faltantes e relacionamentos necessários para o sistema MIEADI

-- 1. Tabela de eventos/aulas específicas de uma turma
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'aula',
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  start_datetime timestamp with time zone NOT NULL,
  end_datetime timestamp with time zone NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'agendado',
  max_attendees integer,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Tabela de materiais didáticos gerais (além dos de turma)
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'document',
  file_url text,
  file_size integer,
  file_type text,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  professor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT false,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Tabela de certificados
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  certificate_type text NOT NULL DEFAULT 'conclusao',
  certificate_number text UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  template_used text,
  validation_code text UNIQUE,
  status text NOT NULL DEFAULT 'ativo',
  file_url text,
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Tabela de submissões de avaliações
CREATE TABLE IF NOT EXISTS public.assessment_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  total_score numeric DEFAULT 0,
  max_score numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'iniciado',
  time_spent_minutes integer,
  answers_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- 5. Tabela de sessões de aula
CREATE TABLE IF NOT EXISTS public.class_sessions_extended (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  title text NOT NULL,
  description text,
  session_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  location text,
  status text NOT NULL DEFAULT 'agendado',
  materials_used text[],
  homework_assigned text,
  notes text,
  attendance_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(class_id, session_number)
);

-- 6. Tabela de frequência/presença estendida
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  class_session_id uuid REFERENCES public.class_sessions_extended(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_type text NOT NULL DEFAULT 'presenca',
  status text NOT NULL DEFAULT 'presente',
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  location_data jsonb,
  verification_method text DEFAULT 'manual',
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Tabela de comunicações/notificações do sistema
CREATE TABLE IF NOT EXISTS public.system_communications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  communication_type text NOT NULL DEFAULT 'notification',
  target_audience text NOT NULL DEFAULT 'all',
  target_roles text[],
  target_congregations uuid[],
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal',
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  delivery_method text[] DEFAULT ARRAY['app'],
  status text NOT NULL DEFAULT 'draft',
  read_by uuid[],
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 8. Criar foreign keys que estavam faltando
-- Adicionar FKs na tabela profiles para congregation, field e course
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_congregation_id_fkey 
FOREIGN KEY (congregation_id) REFERENCES public.congregations(id) ON DELETE SET NULL;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_field_id_fkey 
FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE SET NULL;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela tuition_fees
ALTER TABLE public.tuition_fees 
ADD CONSTRAINT tuition_fees_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tuition_fees 
ADD CONSTRAINT tuition_fees_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela enrollments
ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela classes
ALTER TABLE public.classes 
ADD CONSTRAINT classes_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

ALTER TABLE public.classes 
ADD CONSTRAINT classes_professor_id_fkey 
FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.classes 
ADD CONSTRAINT classes_congregation_id_fkey 
FOREIGN KEY (congregation_id) REFERENCES public.congregations(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela subjects
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_professor_id_fkey 
FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela assessments
ALTER TABLE public.assessments 
ADD CONSTRAINT assessments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela assessment_questions
ALTER TABLE public.assessment_questions 
ADD CONSTRAINT assessment_questions_assessment_id_fkey 
FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela student_answers
ALTER TABLE public.student_answers 
ADD CONSTRAINT student_answers_assessment_id_fkey 
FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

ALTER TABLE public.student_answers 
ADD CONSTRAINT student_answers_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;

ALTER TABLE public.student_answers 
ADD CONSTRAINT student_answers_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela grades
ALTER TABLE public.grades 
ADD CONSTRAINT grades_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.grades 
ADD CONSTRAINT grades_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela attendances
ALTER TABLE public.attendances 
ADD CONSTRAINT attendances_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendances 
ADD CONSTRAINT attendances_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendances 
ADD CONSTRAINT attendances_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.class_sessions(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela class_materials
ALTER TABLE public.class_materials 
ADD CONSTRAINT class_materials_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.class_materials 
ADD CONSTRAINT class_materials_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela class_schedules
ALTER TABLE public.class_schedules 
ADD CONSTRAINT class_schedules_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela class_sessions
ALTER TABLE public.class_sessions 
ADD CONSTRAINT class_sessions_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela payments
ALTER TABLE public.payments 
ADD CONSTRAINT payments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela member_requests
ALTER TABLE public.member_requests 
ADD CONSTRAINT member_requests_congregation_id_fkey 
FOREIGN KEY (congregation_id) REFERENCES public.congregations(id) ON DELETE SET NULL;

ALTER TABLE public.member_requests 
ADD CONSTRAINT member_requests_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela member_indications
ALTER TABLE public.member_indications 
ADD CONSTRAINT member_indications_indicating_member_id_fkey 
FOREIGN KEY (indicating_member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.member_indications 
ADD CONSTRAINT member_indications_congregation_id_fkey 
FOREIGN KEY (congregation_id) REFERENCES public.congregations(id) ON DELETE SET NULL;

-- Adicionar FKs na tabela notifications
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar FKs na tabela fields
ALTER TABLE public.fields 
ADD CONSTRAINT fields_responsible_id_fkey 
FOREIGN KEY (responsible_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_communications ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_submissions_updated_at
  BEFORE UPDATE ON public.assessment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_sessions_extended_updated_at
  BEFORE UPDATE ON public.class_sessions_extended
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_communications_updated_at
  BEFORE UPDATE ON public.system_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();