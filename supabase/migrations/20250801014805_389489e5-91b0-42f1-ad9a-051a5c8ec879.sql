-- Fix search_path for all remaining functions
SET search_path TO public;

-- Fix all remaining functions with search_path
CREATE OR REPLACE FUNCTION public.set_default_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se não tem password_hash definido, configurar senha padrão "mudar123"
  IF NEW.password_hash IS NULL THEN
    NEW.password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.';
  END IF;
  
  -- Garantir que seja marcado como primeiro login
  IF NEW.first_login IS NULL THEN
    NEW.first_login = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_person_absent(person_uuid uuid, check_date date DEFAULT CURRENT_DATE)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar ausência programada ativa
  IF EXISTS (
    SELECT 1 FROM scheduled_absences 
    WHERE person_id = person_uuid 
    AND is_active = true
    AND check_date >= start_date 
    AND check_date <= end_date
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar flag de ausência direta no perfil
  IF EXISTS (
    SELECT 1 FROM profiles 
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

CREATE OR REPLACE FUNCTION public.reactivate_expired_absences()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  reactivated_count INTEGER := 0;
BEGIN
  -- Desativar ausências programadas expiradas
  UPDATE scheduled_absences 
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
  AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS reactivated_count = ROW_COUNT;
  
  -- Reativar perfis com ausência expirada
  UPDATE profiles 
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

CREATE OR REPLACE FUNCTION public.can_user_access_class(class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    -- Admin/coordenador pode ver todas
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  ) OR EXISTS (
    -- Professor pode ver suas turmas
    SELECT 1 FROM classes 
    WHERE id = class_id 
    AND professor_id = auth.uid()
  ) OR EXISTS (
    -- Estudante pode ver turmas onde está matriculado
    SELECT 1 FROM enrollments 
    WHERE class_id = class_id 
    AND student_id = auth.uid()
  ) OR EXISTS (
    -- Professor pode ver turmas onde leciona alguma disciplina
    SELECT 1 FROM class_subjects cs
    JOIN subjects s ON cs.subject_id = s.id
    WHERE cs.class_id = class_id 
    AND s.professor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_subject_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$$;

CREATE OR REPLACE FUNCTION public.reset_user_password(user_cpf text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE profiles 
    SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_login = TRUE,
        last_password_change = NOW()
    WHERE cpf = user_cpf;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_student_average(student_uuid uuid, class_uuid uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    average_grade numeric;
BEGIN
    SELECT COALESCE(AVG(grade), 0)
    INTO average_grade
    FROM grades
    WHERE student_id = student_uuid
    AND (class_uuid IS NULL OR class_id = class_uuid);
    
    RETURN ROUND(average_grade, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_student_attendance(student_uuid uuid, class_uuid uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    attendance_rate numeric;
    total_sessions integer;
    present_sessions integer;
BEGIN
    -- Contar total de sessões/aulas
    SELECT COUNT(*)
    INTO total_sessions
    FROM attendances
    WHERE student_id = student_uuid
    AND (class_uuid IS NULL OR class_id = class_uuid);
    
    -- Contar presenças
    SELECT COUNT(*)
    INTO present_sessions
    FROM attendances
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

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
            SELECT 1 FROM certificates 
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

CREATE OR REPLACE FUNCTION public.generate_validation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
            SELECT 1 FROM certificates 
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

CREATE OR REPLACE FUNCTION public.auto_generate_certificate_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.mark_communication_as_read(communication_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE system_communications
    SET read_by = COALESCE(read_by, ARRAY[]::uuid[]) || ARRAY[user_id]
    WHERE id = communication_id
    AND NOT (user_id = ANY(COALESCE(read_by, ARRAY[]::uuid[])));
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_subject_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_subject_code();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_pin_attempts_if_expired(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE profiles 
    SET pin_attempts = 0, pin_locked_until = NULL
    WHERE id = user_id 
    AND pin_locked_until IS NOT NULL 
    AND pin_locked_until < NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_two_factor_pin(user_id uuid, pin_input character varying)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    -- Resetar tentativas expiradas
    PERFORM reset_pin_attempts_if_expired(user_id);
    
    -- Buscar perfil
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE id = user_id;
    
    -- Verificar se está bloqueado
    IF profile_record.pin_locked_until IS NOT NULL AND profile_record.pin_locked_until > NOW() THEN
        result := json_build_object(
            'success', false,
            'error', 'PIN temporariamente bloqueado. Tente novamente mais tarde.',
            'locked_until', profile_record.pin_locked_until
        );
        RETURN result;
    END IF;
    
    -- Verificar PIN
    IF profile_record.two_factor_pin = pin_input THEN
        -- PIN correto - resetar tentativas
        UPDATE profiles 
        SET pin_attempts = 0, pin_locked_until = NULL
        WHERE id = user_id;
        
        result := json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso'
        );
    ELSE
        -- PIN incorreto - incrementar tentativas
        UPDATE profiles 
        SET pin_attempts = COALESCE(pin_attempts, 0) + 1,
            pin_locked_until = CASE 
                WHEN COALESCE(pin_attempts, 0) + 1 >= 3 THEN NOW() + INTERVAL '15 minutes'
                ELSE pin_locked_until 
            END
        WHERE id = user_id;
        
        result := json_build_object(
            'success', false,
            'error', 'PIN incorreto',
            'attempts_remaining', 3 - (COALESCE(profile_record.pin_attempts, 0) + 1)
        );
    END IF;
    
    RETURN result;
END;
$$;