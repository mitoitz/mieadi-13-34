-- Adicionar função para gerar número de matrícula automaticamente
CREATE OR REPLACE FUNCTION generate_badge_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_number integer;
    badge_number text;
BEGIN
    -- Buscar o maior número atual e adicionar 1
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(badge_number, '[^0-9]', '', 'g') AS integer)), 0) + 1
    INTO next_number
    FROM profiles
    WHERE badge_number IS NOT NULL 
    AND badge_number ~ '^[0-9]+$';
    
    -- Se não encontrou nenhum número, começar com 1001
    IF next_number <= 1000 THEN
        next_number := 1001;
    END IF;
    
    -- Formatar com zeros à esquerda (6 dígitos)
    badge_number := LPAD(next_number::text, 6, '0');
    
    RETURN badge_number;
END;
$$;

-- Atualizar registros existentes sem número de matrícula
UPDATE profiles 
SET badge_number = generate_badge_number()
WHERE badge_number IS NULL OR badge_number = '';

-- Criar trigger para gerar automaticamente o número de matrícula
CREATE OR REPLACE FUNCTION auto_generate_badge_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.badge_number IS NULL OR NEW.badge_number = '' THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Criar trigger que executa antes de inserir novos registros
CREATE TRIGGER trigger_auto_badge_number
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_badge_number();