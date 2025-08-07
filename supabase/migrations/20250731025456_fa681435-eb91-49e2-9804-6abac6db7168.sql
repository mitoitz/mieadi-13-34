-- Verificar e corrigir estrutura de tabelas
-- Criar tabela subjects se não existir
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    credits INTEGER DEFAULT 4,
    workload_hours INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Criar política para subjects
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
));

-- Verificar se a coluna max_students existe na tabela classes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' 
        AND column_name = 'max_students'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN max_students INTEGER DEFAULT 30;
    END IF;
END $$;

-- Trigger para updated_at em subjects
CREATE OR REPLACE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais para subjects se não existirem
INSERT INTO public.subjects (name, code, description, credits, workload_hours)
SELECT * FROM (VALUES
    ('Bíblia Sagrada I', 'BS001', 'Introdução ao estudo das Sagradas Escrituras', 4, 60),
    ('Bíblia Sagrada II', 'BS002', 'Aprofundamento no estudo bíblico', 4, 60),
    ('Teologia Sistemática I', 'TS001', 'Fundamentos da teologia sistemática', 6, 90),
    ('História da Igreja', 'HI001', 'História do cristianismo através dos séculos', 4, 60),
    ('Homilética', 'HO001', 'Arte da pregação e comunicação cristã', 4, 60),
    ('Grego Bíblico', 'GB001', 'Estudo do grego do Novo Testamento', 6, 90),
    ('Hebraico Bíblico', 'HB001', 'Estudo do hebraico do Antigo Testamento', 6, 90),
    ('Ética Cristã', 'EC001', 'Princípios éticos na perspectiva cristã', 4, 60)
) AS v(name, code, description, credits, workload_hours)
WHERE NOT EXISTS (
    SELECT 1 FROM public.subjects WHERE subjects.code = v.code
);