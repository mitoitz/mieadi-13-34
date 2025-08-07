-- Criar tabela para dados biométricos
CREATE TABLE IF NOT EXISTS public.biometric_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fingerprint_data TEXT,
  face_data TEXT,
  fingerprint_quality INTEGER DEFAULT 0,
  face_quality INTEGER DEFAULT 0,
  encryption_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para histórico de verificações biométricas
CREATE TABLE IF NOT EXISTS public.biometric_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('fingerprint', 'face', 'both')),
  verification_result BOOLEAN NOT NULL,
  confidence_score INTEGER NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações de segurança biométrica
CREATE TABLE IF NOT EXISTS public.biometric_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_fingerprint_quality INTEGER DEFAULT 70,
  min_face_quality INTEGER DEFAULT 75,
  max_verification_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 300, -- segundos
  encryption_enabled BOOLEAN DEFAULT true,
  audit_enabled BOOLEAN DEFAULT true,
  backup_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para biometric_data
CREATE POLICY "Users can view their own biometric data" 
ON public.biometric_data 
FOR SELECT 
USING (person_id = auth.uid());

CREATE POLICY "Users can update their own biometric data" 
ON public.biometric_data 
FOR UPDATE 
USING (person_id = auth.uid());

CREATE POLICY "Users can insert their own biometric data" 
ON public.biometric_data 
FOR INSERT 
WITH CHECK (person_id = auth.uid());

CREATE POLICY "Admins can manage all biometric data" 
ON public.biometric_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Políticas para biometric_verifications
CREATE POLICY "Users can view their own verifications" 
ON public.biometric_verifications 
FOR SELECT 
USING (person_id = auth.uid());

CREATE POLICY "System can insert verification records" 
ON public.biometric_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all verifications" 
ON public.biometric_verifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Políticas para biometric_settings
CREATE POLICY "Admins can manage biometric settings" 
ON public.biometric_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Políticas para security_audit_log
CREATE POLICY "Admins can view security audit log" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can insert audit records" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_biometric_data_person_id ON public.biometric_data(person_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verifications_person_id ON public.biometric_verifications(person_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verifications_created_at ON public.biometric_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);

-- Inserir configurações padrão
INSERT INTO public.biometric_settings (
  min_fingerprint_quality,
  min_face_quality,
  max_verification_attempts,
  lockout_duration,
  encryption_enabled,
  audit_enabled,
  backup_enabled
) VALUES (
  70, 75, 5, 300, true, true, true
) ON CONFLICT DO NOTHING;

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_biometric_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_biometric_data_updated_at
  BEFORE UPDATE ON public.biometric_data
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_updated_at();

CREATE TRIGGER update_biometric_settings_updated_at
  BEFORE UPDATE ON public.biometric_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_updated_at();