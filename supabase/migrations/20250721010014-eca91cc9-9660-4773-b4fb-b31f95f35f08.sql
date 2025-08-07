-- Criar tabela para armazenar biometrias individuais por dedo
CREATE TABLE public.fingerprint_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL,
  finger_type TEXT NOT NULL, -- 'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_pinky', 'right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_pinky'
  fingerprint_template BYTEA, -- Template binário da digital
  fingerprint_quality INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(person_id, finger_type)
);

-- Habilitar RLS
ALTER TABLE public.fingerprint_data ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own fingerprint data"
ON public.fingerprint_data
FOR SELECT
USING (person_id = auth.uid());

CREATE POLICY "Admins can manage all fingerprint data"
ON public.fingerprint_data
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
));

CREATE POLICY "System can insert fingerprint data"
ON public.fingerprint_data
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update fingerprint data"
ON public.fingerprint_data
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_fingerprint_data_updated_at
  BEFORE UPDATE ON public.fingerprint_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_fingerprint_data_person_id ON public.fingerprint_data(person_id);
CREATE INDEX idx_fingerprint_data_finger_type ON public.fingerprint_data(finger_type);
CREATE INDEX idx_fingerprint_data_active ON public.fingerprint_data(is_active);

-- Atualizar tabela de verificações biométricas para incluir finger_type
ALTER TABLE public.biometric_verifications 
ADD COLUMN finger_type TEXT,
ADD COLUMN verification_method TEXT DEFAULT 'fingerprint';

-- Criar função para verificar múltiplas digitais
CREATE OR REPLACE FUNCTION public.verify_multiple_fingerprints(
  input_template BYTEA,
  quality_threshold INTEGER DEFAULT 70
)
RETURNS TABLE(
  person_id UUID,
  finger_type TEXT,
  confidence_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função será implementada com a lógica específica do SDK U.are.U
  -- Por enquanto, retorna uma estrutura base
  RETURN QUERY
  SELECT 
    fp.person_id,
    fp.finger_type,
    0.0::NUMERIC as confidence_score
  FROM public.fingerprint_data fp
  WHERE fp.is_active = true
  AND fp.fingerprint_quality >= quality_threshold
  LIMIT 0; -- Placeholder até implementação real
END;
$$;