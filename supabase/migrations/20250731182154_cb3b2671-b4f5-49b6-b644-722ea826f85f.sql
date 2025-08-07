-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.generate_subject_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Corrigir função trigger
CREATE OR REPLACE FUNCTION public.auto_generate_subject_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := public.generate_subject_code();
    END IF;
    RETURN NEW;
END;
$$;