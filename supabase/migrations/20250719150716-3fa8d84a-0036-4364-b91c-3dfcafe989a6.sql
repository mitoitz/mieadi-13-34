-- Criar funções úteis para o sistema

-- Função para calcular média de um aluno
CREATE OR REPLACE FUNCTION public.calculate_student_average(student_uuid uuid, class_uuid uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    average_grade numeric;
BEGIN
    SELECT COALESCE(AVG(grade), 0)
    INTO average_grade
    FROM public.grades
    WHERE student_id = student_uuid
    AND (class_uuid IS NULL OR class_id = class_uuid);
    
    RETURN ROUND(average_grade, 2);
END;
$$;

-- Função para calcular frequência de um aluno
CREATE OR REPLACE FUNCTION public.calculate_student_attendance(student_uuid uuid, class_uuid uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    attendance_rate numeric;
    total_sessions integer;
    present_sessions integer;
BEGIN
    -- Contar total de sessões/aulas
    SELECT COUNT(*)
    INTO total_sessions
    FROM public.attendances
    WHERE student_id = student_uuid
    AND (class_uuid IS NULL OR class_id = class_uuid);
    
    -- Contar presenças
    SELECT COUNT(*)
    INTO present_sessions
    FROM public.attendances
    WHERE student_id = student_uuid
    AND status = 'presente'
    AND (class_uuid IS NULL OR class_id = class_uuid);
    
    -- Calcular percentual
    IF total_sessions > 0 THEN
        attendance_rate := (present_sessions::numeric / total_sessions::numeric) * 100;
    ELSE
        attendance_rate := 0;
    END IF;
    
    RETURN ROUND(attendance_rate, 2);
END;
$$;

-- Função para gerar número de certificado único
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_number text;
    exists_check boolean;
BEGIN
    LOOP
        -- Gerar número: CERT-YYYY-NNNNNN
        new_number := 'CERT-' || EXTRACT(year FROM NOW()) || '-' || 
                      LPAD((RANDOM() * 999999)::integer::text, 6, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM public.certificates 
            WHERE certificate_number = new_number
        ) INTO exists_check;
        
        -- Se não existe, usar este número
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$;

-- Função para gerar código de validação único
CREATE OR REPLACE FUNCTION public.generate_validation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_code text;
    exists_check boolean;
BEGIN
    LOOP
        -- Gerar código alfanumérico de 8 caracteres
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM public.certificates 
            WHERE validation_code = new_code
        ) INTO exists_check;
        
        -- Se não existe, usar este código
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Trigger para auto-gerar números de certificado
CREATE OR REPLACE FUNCTION public.auto_generate_certificate_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Gerar número do certificado se não fornecido
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := generate_certificate_number();
    END IF;
    
    -- Gerar código de validação se não fornecido
    IF NEW.validation_code IS NULL THEN
        NEW.validation_code := generate_validation_code();
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_certificate_data_trigger
    BEFORE INSERT ON public.certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_certificate_data();

-- Função para marcar comunicação como lida
CREATE OR REPLACE FUNCTION public.mark_communication_as_read(communication_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.system_communications
    SET read_by = COALESCE(read_by, ARRAY[]::uuid[]) || ARRAY[user_id]
    WHERE id = communication_id
    AND NOT (user_id = ANY(COALESCE(read_by, ARRAY[]::uuid[])));
END;
$$;