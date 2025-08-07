-- Adicionar função para geração automática de código de disciplina
CREATE OR REPLACE FUNCTION public.generate_subject_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    exists_check BOOLEAN;
    year_suffix TEXT;
    counter INTEGER := 1;
BEGIN
    -- Usar os últimos 2 dígitos do ano atual
    year_suffix := TO_CHAR(NOW(), 'YY');
    
    LOOP
        -- Gerar código: DISC + ano + número sequencial (3 dígitos)
        new_code := 'DISC' || year_suffix || LPAD(counter::TEXT, 3, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM public.subjects 
            WHERE code = new_code
        ) INTO exists_check;
        
        -- Se não existe, usar este código
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Função trigger para auto-gerar código
CREATE OR REPLACE FUNCTION public.auto_generate_subject_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_subject_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para subjects
DROP TRIGGER IF EXISTS trigger_auto_generate_subject_code ON public.subjects;
CREATE TRIGGER trigger_auto_generate_subject_code
    BEFORE INSERT ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_subject_code();

-- Criar tabela para relacionar múltiplas disciplinas com turmas
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(class_id, subject_id)
);

-- Adicionar RLS para class_subjects
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para class_subjects
CREATE POLICY "Users can view class subjects for accessible classes"
    ON public.class_subjects FOR SELECT
    USING (can_user_access_class(class_id));

CREATE POLICY "Admins and teachers can manage class subjects"
    ON public.class_subjects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.classes 
            WHERE id = class_subjects.class_id 
            AND professor_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_class_subjects_updated_at
    BEFORE UPDATE ON public.class_subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar política RLS das classes para melhor acesso
DROP POLICY IF EXISTS "Users can view accessible classes" ON public.classes;
CREATE POLICY "Users can view accessible classes" 
    ON public.classes FOR SELECT
    USING (can_user_access_class(id));

-- Melhorar função can_user_access_class para incluir class_subjects
CREATE OR REPLACE FUNCTION public.can_user_access_class(class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    -- Admin/coordenador pode ver todas
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  ) OR EXISTS (
    -- Professor pode ver suas turmas
    SELECT 1 FROM public.classes 
    WHERE id = class_id 
    AND professor_id = auth.uid()
  ) OR EXISTS (
    -- Estudante pode ver turmas onde está matriculado
    SELECT 1 FROM public.enrollments 
    WHERE class_id = class_id 
    AND student_id = auth.uid()
  ) OR EXISTS (
    -- Professor pode ver turmas onde leciona alguma disciplina
    SELECT 1 FROM public.class_subjects cs
    JOIN public.subjects s ON cs.subject_id = s.id
    WHERE cs.class_id = class_id 
    AND s.professor_id = auth.uid()
  );
$function$;

-- Migrar dados existentes da relação subject_id em classes para class_subjects
INSERT INTO public.class_subjects (class_id, subject_id, is_primary, order_index)
SELECT 
    c.id as class_id,
    c.subject_id,
    true as is_primary,
    1 as order_index
FROM public.classes c
WHERE c.subject_id IS NOT NULL
ON CONFLICT (class_id, subject_id) DO NOTHING;