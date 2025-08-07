-- Corrigir funções com search_path mutable
-- Atualizar funções críticas com search_path seguro

-- 1. Corrigir função generate_qr_code
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_code := 'QR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
        
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE qr_code = new_code
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$function$;

-- 2. Corrigir função generate_badge_number  
CREATE OR REPLACE FUNCTION public.generate_badge_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    next_number integer;
    new_badge_number text;
BEGIN
    -- Buscar o maior número atual e adicionar 1
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(p.badge_number, '[^0-9]', '', 'g') AS integer)), 0) + 1
    INTO next_number
    FROM profiles p
    WHERE p.badge_number IS NOT NULL 
    AND p.badge_number ~ '^[0-9]+$';
    
    -- Se não encontrou nenhum número, começar com 1001
    IF next_number <= 1000 THEN
        next_number := 1001;
    END IF;
    
    -- Formatar com zeros à esquerda (6 dígitos)
    new_badge_number := LPAD(next_number::text, 6, '0');
    
    RETURN new_badge_number;
END;
$function$;

-- 3. Corrigir função generate_subject_code
CREATE OR REPLACE FUNCTION public.generate_subject_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
            SELECT 1 FROM subjects 
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
$function$;