-- Corrigir estrutura da tabela subjects
-- Verificar se a coluna workload_hours existe e criar se necessário
DO $$ 
BEGIN
    -- Adicionar coluna workload_hours se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'workload_hours'
    ) THEN
        ALTER TABLE public.subjects ADD COLUMN workload_hours INTEGER DEFAULT 60;
    END IF;
    
    -- Adicionar coluna code se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'code'
    ) THEN
        ALTER TABLE public.subjects ADD COLUMN code TEXT;
    END IF;
    
    -- Adicionar coluna credits se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'credits'
    ) THEN
        ALTER TABLE public.subjects ADD COLUMN credits INTEGER DEFAULT 4;
    END IF;
END $$;

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
    SELECT 1 FROM public.subjects WHERE subjects.name = v.name
);