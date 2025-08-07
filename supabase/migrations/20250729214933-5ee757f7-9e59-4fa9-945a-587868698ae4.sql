-- Remove biometric-related tables and update profiles table for new auth system
DROP TABLE IF EXISTS biometric_data CASCADE;
DROP TABLE IF EXISTS biometric_settings CASCADE;
DROP TABLE IF EXISTS biometric_verifications CASCADE;
DROP TABLE IF EXISTS fingerprint_data CASCADE;

-- Update profiles table to support new auth system
ALTER TABLE profiles 
DROP COLUMN IF EXISTS biometric_data,
DROP COLUMN IF EXISTS facial_data,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Create QR codes for existing users
UPDATE profiles 
SET qr_code = 'QR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12))
WHERE qr_code IS NULL;

-- Remove biometric functions
DROP FUNCTION IF EXISTS verify_multiple_fingerprints(bytea, integer);

-- Create function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger to auto-generate QR codes for new users
CREATE OR REPLACE FUNCTION auto_generate_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_qr_code_trigger ON profiles;
CREATE TRIGGER generate_qr_code_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_qr_code();

-- Set default password (hash for 'mudar123') for all users without password
-- Using bcrypt hash for 'mudar123'
UPDATE profiles 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE password_hash IS NULL;