-- Criação das tabelas para API de Biometria e Reconhecimento Facial

-- Tabela de dados biométricos
CREATE TABLE IF NOT EXISTS public.biometric_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    fingerprint_hash TEXT,
    face_encoding TEXT,
    fingerprint_quality INTEGER CHECK (fingerprint_quality >= 0 AND fingerprint_quality <= 100),
    face_quality INTEGER CHECK (face_quality >= 0 AND face_quality <= 100),
    encryption_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Tabela de verificações biométricas
CREATE TABLE IF NOT EXISTS public.biometric_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('fingerprint', 'face')),
    verification_result BOOLEAN,
    confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Tabela de configurações biométricas
CREATE TABLE IF NOT EXISTS public.biometric_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_fingerprint_quality INTEGER DEFAULT 70 CHECK (min_fingerprint_quality >= 0 AND min_fingerprint_quality <= 100),
    min_face_quality INTEGER DEFAULT 75 CHECK (min_face_quality >= 0 AND min_face_quality <= 100),
    max_verification_attempts INTEGER DEFAULT 5,
    lockout_duration INTEGER DEFAULT 300, -- em segundos
    encryption_enabled BOOLEAN DEFAULT true,
    audit_enabled BOOLEAN DEFAULT true,
    backup_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Tabela de logs de auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Criação das tabelas para API de Recibos de Frequência

-- Tabela de recibos de frequência
CREATE TABLE IF NOT EXISTS public.attendance_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    receipt_data JSONB NOT NULL,
    template_id UUID,
    printed_at TIMESTAMP WITH TIME ZONE,
    print_method TEXT CHECK (print_method IN ('thermal', 'pdf', 'email')),
    printer_info JSONB,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'printed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de templates de recibos
CREATE TABLE IF NOT EXISTS public.receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('attendance', 'payment', 'certificate')),
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    paper_size TEXT DEFAULT 'thermal_58mm' CHECK (paper_size IN ('thermal_58mm', 'thermal_80mm', 'a4', 'letter')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para gerar número único de recibo
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Gerar número: REC-YYYYMMDD-NNNNNN
        new_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM public.attendance_receipts 
            WHERE receipt_number = new_number
        ) INTO exists_check;
        
        -- Se não existe, usar este número
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número do recibo automaticamente
CREATE OR REPLACE FUNCTION auto_generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_receipt_number
    BEFORE INSERT ON public.attendance_receipts
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_receipt_number();

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_biometric_data_updated_at
    BEFORE UPDATE ON public.biometric_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_biometric_settings_updated_at
    BEFORE UPDATE ON public.biometric_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_attendance_receipts_updated_at
    BEFORE UPDATE ON public.attendance_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_receipt_templates_updated_at
    BEFORE UPDATE ON public.receipt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biometric_data_person_id ON public.biometric_data(person_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_active ON public.biometric_data(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_biometric_verifications_person_id ON public.biometric_verifications(person_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verifications_created_at ON public.biometric_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_receipts_student_id ON public.attendance_receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_receipts_class_id ON public.attendance_receipts(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_receipts_receipt_number ON public.attendance_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_type ON public.receipt_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_active ON public.receipt_templates(is_active) WHERE is_active = true;

-- RLS Policies para segurança

-- Biometric Data Policies
ALTER TABLE public.biometric_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own biometric data" ON public.biometric_data
    FOR SELECT USING (person_id = auth.uid());

CREATE POLICY "Admins can manage all biometric data" ON public.biometric_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Biometric Verifications Policies
ALTER TABLE public.biometric_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification history" ON public.biometric_verifications
    FOR SELECT USING (person_id = auth.uid());

CREATE POLICY "System can insert verification records" ON public.biometric_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all verifications" ON public.biometric_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Biometric Settings Policies
ALTER TABLE public.biometric_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage biometric settings" ON public.biometric_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view biometric settings" ON public.biometric_settings
    FOR SELECT USING (true);

-- Security Audit Logs Policies
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security audit logs" ON public.security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (true);

-- Attendance Receipts Policies
ALTER TABLE public.attendance_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own receipts" ON public.attendance_receipts
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view receipts from their classes" ON public.attendance_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classes 
            WHERE id = attendance_receipts.class_id AND professor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all receipts" ON public.attendance_receipts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "System can generate receipts" ON public.attendance_receipts
    FOR INSERT WITH CHECK (true);

-- Receipt Templates Policies
ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active templates" ON public.receipt_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all templates" ON public.receipt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Inserir configuração padrão biométrica
INSERT INTO public.biometric_settings (
    min_fingerprint_quality,
    min_face_quality,
    max_verification_attempts,
    lockout_duration,
    encryption_enabled,
    audit_enabled,
    backup_enabled
) VALUES (70, 75, 5, 300, true, true, true)
ON CONFLICT DO NOTHING;

-- Inserir template padrão de recibo de frequência
INSERT INTO public.receipt_templates (
    name,
    description,
    template_type,
    template_data,
    is_default,
    is_active,
    paper_size
) VALUES (
    'Template Padrão - Frequência',
    'Template padrão para recibos de frequência',
    'attendance',
    '{"header": {"title": "COMPROVANTE DE FREQUÊNCIA", "subtitle": "MIEADI - Instituto Teológico"}, "body": {"fields": ["student_name", "class_name", "date", "time", "status"]}, "footer": {"text": "Este documento comprova a presença do aluno na atividade especificada."}}',
    true,
    true,
    'thermal_58mm'
) ON CONFLICT DO NOTHING;