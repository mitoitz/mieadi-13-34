-- Criar tabela para gerenciar ausências programadas
CREATE TABLE public.scheduled_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campos de ausência na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN is_absent BOOLEAN DEFAULT false,
ADD COLUMN absence_reason TEXT,
ADD COLUMN absence_start_date DATE,
ADD COLUMN absence_end_date DATE;

-- Habilitar RLS na tabela de ausências
ALTER TABLE public.scheduled_absences ENABLE ROW LEVEL SECURITY;

-- Políticas para ausências programadas
CREATE POLICY "Users can view their own absences"
ON public.scheduled_absences
FOR SELECT
USING (person_id = auth.uid());

CREATE POLICY "Admins can manage all absences"
ON public.scheduled_absences
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role, 'professor'::user_role])
));

CREATE POLICY "Users can create their own absences"
ON public.scheduled_absences
FOR INSERT
WITH CHECK (person_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role, 'professor'::user_role])
));

-- Índices para performance
CREATE INDEX idx_scheduled_absences_person_id ON public.scheduled_absences(person_id);
CREATE INDEX idx_scheduled_absences_dates ON public.scheduled_absences(start_date, end_date);
CREATE INDEX idx_scheduled_absences_active ON public.scheduled_absences(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_scheduled_absences_updated_at
  BEFORE UPDATE ON public.scheduled_absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se uma pessoa está ausente em uma data específica
CREATE OR REPLACE FUNCTION public.is_person_absent(
  person_uuid UUID,
  check_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Verificar ausência programada ativa
  IF EXISTS (
    SELECT 1 FROM public.scheduled_absences 
    WHERE person_id = person_uuid 
    AND is_active = true
    AND check_date >= start_date 
    AND check_date <= end_date
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar flag de ausência direta no perfil
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = person_uuid 
    AND is_absent = true
    AND (absence_start_date IS NULL OR check_date >= absence_start_date)
    AND (absence_end_date IS NULL OR check_date <= absence_end_date)
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Função para reativar automaticamente pessoas após período de ausência
CREATE OR REPLACE FUNCTION public.reactivate_expired_absences()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reactivated_count INTEGER := 0;
BEGIN
  -- Desativar ausências programadas expiradas
  UPDATE public.scheduled_absences 
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
  AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS reactivated_count = ROW_COUNT;
  
  -- Reativar perfis com ausência expirada
  UPDATE public.profiles 
  SET is_absent = false, 
      absence_reason = NULL,
      absence_start_date = NULL,
      absence_end_date = NULL,
      updated_at = now()
  WHERE is_absent = true 
  AND absence_end_date IS NOT NULL 
  AND absence_end_date < CURRENT_DATE;
  
  RETURN reactivated_count;
END;
$$;