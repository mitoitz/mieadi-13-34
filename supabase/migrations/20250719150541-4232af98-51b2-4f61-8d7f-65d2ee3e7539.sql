-- Criação de tabelas faltantes e relacionamentos (verificando existência)

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

-- 2. Tabela de materiais didáticos gerais
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

-- 5. Tabela de comunicações/notificações do sistema
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

-- 6. Tabela de registros de presença estendida
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
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

-- Enable RLS on new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_system_communications_updated_at
  BEFORE UPDATE ON public.system_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();