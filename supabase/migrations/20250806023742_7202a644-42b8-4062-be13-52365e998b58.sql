-- Adicionar colunas para controle de frequências retroativas
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS is_retroactive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retroactive_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Adicionar colunas para eventos retroativos
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_retroactive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retroactive_reason TEXT;

-- Adicionar colunas para controle de datas retroativas em attendances
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS is_retroactive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retroactive_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Remover constraints de data que impedem registros retroativos se existirem
-- e adicionar função para validar datas retroativas
CREATE OR REPLACE FUNCTION validate_retroactive_attendance()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a data é anterior a hoje e não está marcada como retroativa
    IF NEW.date < CURRENT_DATE AND NOT COALESCE(NEW.is_retroactive, FALSE) THEN
        NEW.is_retroactive = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-detectar frequências retroativas
DROP TRIGGER IF EXISTS auto_detect_retroactive_attendance ON attendances;
CREATE TRIGGER auto_detect_retroactive_attendance
    BEFORE INSERT OR UPDATE ON attendances
    FOR EACH ROW
    EXECUTE FUNCTION validate_retroactive_attendance();

-- Função similar para attendance_records
CREATE OR REPLACE FUNCTION validate_retroactive_attendance_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-detectar se é retroativo baseado na data do check_in
    IF DATE(NEW.check_in_time) < CURRENT_DATE AND NOT COALESCE(NEW.is_retroactive, FALSE) THEN
        NEW.is_retroactive = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para attendance_records
DROP TRIGGER IF EXISTS auto_detect_retroactive_record ON attendance_records;
CREATE TRIGGER auto_detect_retroactive_record
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION validate_retroactive_attendance_record();