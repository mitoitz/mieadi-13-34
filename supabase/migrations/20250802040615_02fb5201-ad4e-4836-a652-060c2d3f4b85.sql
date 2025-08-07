-- Criar tabela de relação curso-disciplina para permitir disciplinas em múltiplos cursos
CREATE TABLE IF NOT EXISTS public.course_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(course_id, subject_id)
);

-- Habilitar RLS na tabela course_subjects
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam relações curso-disciplina
CREATE POLICY "Users can view course subjects" 
ON public.course_subjects 
FOR SELECT 
USING (true);

-- Política para permitir que administradores e coordenadores gerenciem as relações
CREATE POLICY "Admins can manage course subjects" 
ON public.course_subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND role IN ('admin', 'coordenador')
  )
);

-- Remover a restrição de curso único na tabela subjects (tornar opcional)
ALTER TABLE public.subjects ALTER COLUMN course_id DROP NOT NULL;

-- Adicionar trigger para atualizar timestamp
CREATE TRIGGER update_course_subjects_updated_at
BEFORE UPDATE ON public.course_subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrar dados existentes da tabela subjects para course_subjects
INSERT INTO public.course_subjects (course_id, subject_id, is_required, created_at, updated_at)
SELECT 
    course_id, 
    id as subject_id, 
    true as is_required,
    created_at,
    updated_at
FROM public.subjects 
WHERE course_id IS NOT NULL
ON CONFLICT (course_id, subject_id) DO NOTHING;

-- Comentário explicativo
COMMENT ON TABLE public.course_subjects IS 'Tabela de relação N:N entre cursos e disciplinas, permitindo que uma disciplina seja usada em múltiplos cursos';
COMMENT ON COLUMN public.course_subjects.is_required IS 'Define se a disciplina é obrigatória ou optativa no curso';
COMMENT ON COLUMN public.course_subjects.order_index IS 'Ordem da disciplina no currículo do curso';