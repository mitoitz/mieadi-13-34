-- Corrigir políticas RLS para tabelas acadêmicas para permitir acesso aos administradores, secretários e coordenadores

-- Atualizar políticas da tabela subjects
DROP POLICY IF EXISTS "Admins can create subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;

CREATE POLICY "Admins, coordinators and secretaries can manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenador', 'secretario')
  )
);

-- Atualizar política de visualização para incluir professores
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Users can view subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenador', 'secretario', 'professor', 'aluno', 'membro')
  )
);

-- Verificar se tabela subjects existe e tem RLS habilitado
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Corrigir política da tabela courses para secretários
DROP POLICY IF EXISTS "Admins can create courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;

CREATE POLICY "Admins, coordinators and secretaries can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'coordenador', 'secretario')
  )
);

-- Criar tabela subjects se não existir
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  credits integer DEFAULT 0,
  course_id uuid REFERENCES public.courses(id),
  professor_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Trigger para auto-gerar código da disciplina se não existir
CREATE OR REPLACE TRIGGER trigger_auto_generate_subject_code
  BEFORE INSERT ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_subject_code();

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER trigger_update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();