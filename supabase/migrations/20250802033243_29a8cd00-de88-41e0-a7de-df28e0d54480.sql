-- Melhorar relacionamentos e adicionar funcionalidades em falta

-- Criar trigger para atualizar badges automaticamente
CREATE OR REPLACE FUNCTION update_badge_numbers()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não tem badge_number, gerar automaticamente
    IF NEW.badge_number IS NULL OR NEW.badge_number = '' THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    
    -- Se não tem QR code, gerar automaticamente
    IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para profiles
DROP TRIGGER IF EXISTS trigger_update_badge_numbers ON profiles;
CREATE TRIGGER trigger_update_badge_numbers
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_badge_numbers();

-- Criar índices para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_qr_code ON profiles(qr_code);
CREATE INDEX IF NOT EXISTS idx_profiles_badge_number ON profiles(badge_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Índices para melhorar performance em attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON attendance_records(check_in_time);

-- Índices para enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Criar view para facilitar consultas de frequência
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    ar.id,
    ar.student_id,
    p.full_name AS student_name,
    p.cpf AS student_cpf,
    p.badge_number,
    ar.class_id,
    c.name AS class_name,
    ar.event_id,
    e.title AS event_title,
    ar.check_in_time,
    ar.check_out_time,
    ar.status,
    ar.attendance_type,
    ar.verification_method,
    ar.created_at
FROM attendance_records ar
LEFT JOIN profiles p ON ar.student_id = p.id
LEFT JOIN classes c ON ar.class_id = c.id  
LEFT JOIN events e ON ar.event_id = e.id;

-- Criar função para buscar pessoas por diferentes critérios
CREATE OR REPLACE FUNCTION search_people(search_term TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    cpf TEXT,
    email TEXT,
    phone TEXT,
    role USER_ROLE,
    status TEXT,
    qr_code TEXT,
    badge_number TEXT,
    photo_url TEXT,
    congregation_name TEXT,
    field_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.cpf,
        p.email,
        p.phone,
        p.role,
        p.status,
        p.qr_code,
        p.badge_number,
        p.photo_url,
        c.name AS congregation_name,
        f.name AS field_name
    FROM profiles p
    LEFT JOIN congregations c ON p.congregation_id = c.id
    LEFT JOIN fields f ON p.field_id = f.id
    WHERE 
        (search_term = '' OR search_term IS NULL) OR
        (p.full_name ILIKE '%' || search_term || '%') OR
        (p.cpf ILIKE '%' || search_term || '%') OR
        (p.email ILIKE '%' || search_term || '%') OR
        (p.qr_code ILIKE '%' || search_term || '%') OR
        (p.badge_number ILIKE '%' || search_term || '%')
    ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar dados existentes que possam estar com campos em branco
UPDATE profiles 
SET badge_number = generate_badge_number() 
WHERE badge_number IS NULL OR badge_number = '';

UPDATE profiles 
SET qr_code = generate_qr_code() 
WHERE qr_code IS NULL OR qr_code = '';

-- Comentários nas tabelas para documentação
COMMENT ON TABLE profiles IS 'Tabela principal de pessoas do sistema MIEADI';
COMMENT ON TABLE attendance_records IS 'Registros de frequência/presença em aulas e eventos';
COMMENT ON TABLE enrollments IS 'Matrículas de alunos em turmas/cursos';
COMMENT ON VIEW attendance_summary IS 'View consolidada para relatórios de frequência';

-- Função para verificar se pessoa pode ser marcada como presente
CREATE OR REPLACE FUNCTION can_mark_attendance(
    p_student_id UUID,
    p_class_id UUID DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_record INTEGER;
BEGIN
    -- Verificar se já existe registro para hoje
    SELECT COUNT(*) INTO existing_record
    FROM attendance_records
    WHERE student_id = p_student_id
    AND DATE(check_in_time) = p_date
    AND (
        (p_class_id IS NOT NULL AND class_id = p_class_id) OR
        (p_event_id IS NOT NULL AND event_id = p_event_id)
    );
    
    RETURN existing_record = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;