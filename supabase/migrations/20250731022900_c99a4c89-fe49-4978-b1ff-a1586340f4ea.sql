-- Verificar se há algum problema de configuração inicial das tabelas essenciais

-- Garantir que a função de gerar QR code funciona corretamente
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
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

-- Trigger para auto gerar QR code nos profiles
DROP TRIGGER IF EXISTS auto_generate_qr_code_trigger ON public.profiles;
CREATE TRIGGER auto_generate_qr_code_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_qr_code();

-- Trigger para definir senha padrão
DROP TRIGGER IF EXISTS set_default_password_trigger ON public.profiles;
CREATE TRIGGER set_default_password_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_password();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger updated_at nas tabelas principais
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_congregations_updated_at ON public.congregations;
CREATE TRIGGER update_congregations_updated_at
    BEFORE UPDATE ON public.congregations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fields_updated_at ON public.fields;
CREATE TRIGGER update_fields_updated_at
    BEFORE UPDATE ON public.fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();