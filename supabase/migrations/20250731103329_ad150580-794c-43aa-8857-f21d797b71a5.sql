-- Criar tabela auto_billing_rules se não existir
CREATE TABLE IF NOT EXISTS public.auto_billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    billing_day INTEGER NOT NULL CHECK (billing_day >= 1 AND billing_day <= 31),
    amount NUMERIC(10,2) NOT NULL,
    class_id UUID REFERENCES public.classes(id),
    subject_id UUID REFERENCES public.subjects(id),
    student_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para auto_billing_rules
ALTER TABLE public.auto_billing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage auto billing rules" ON public.auto_billing_rules;
CREATE POLICY "Only admins can manage auto billing rules" ON public.auto_billing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

-- Criar tabela auto_billing_executions se não existir
CREATE TABLE IF NOT EXISTS public.auto_billing_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES public.auto_billing_rules(id),
    execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fees_generated INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para auto_billing_executions
ALTER TABLE public.auto_billing_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view billing executions" ON public.auto_billing_executions;
CREATE POLICY "Only admins can view billing executions" ON public.auto_billing_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

-- Garantir que as tabelas subjects existam
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE,
    credits INTEGER DEFAULT 0,
    workload INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects" ON public.subjects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage subjects" ON public.subjects;
CREATE POLICY "Only admins can manage subjects" ON public.subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );