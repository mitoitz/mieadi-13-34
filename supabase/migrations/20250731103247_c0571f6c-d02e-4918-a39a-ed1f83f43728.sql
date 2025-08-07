-- Verificar se tabela tuition_fees existe, senão criar
CREATE TABLE IF NOT EXISTS public.tuition_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.tuition_fees ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tuition_fees
CREATE POLICY "Students can view their own tuition fees" ON public.tuition_fees
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all tuition fees" ON public.tuition_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Teachers can view fees from their classes" ON public.tuition_fees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classes 
            WHERE id = tuition_fees.class_id 
            AND professor_id = auth.uid()
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_tuition_fees_updated_at
    BEFORE UPDATE ON public.tuition_fees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE POLICY "Only admins can view billing executions" ON public.auto_billing_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

-- Atualizar trigger para auto_billing_rules
CREATE TRIGGER update_auto_billing_rules_updated_at
    BEFORE UPDATE ON public.auto_billing_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE POLICY "Anyone can view subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage subjects" ON public.subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordenador')
        )
    );

-- Trigger para subjects
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();