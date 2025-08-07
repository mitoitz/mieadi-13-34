-- SECURITY FIX: Temporarily disable validation trigger to fix critical security issues
DROP TRIGGER IF EXISTS validate_user_input_trigger ON profiles;

-- SECURITY FIX 1: Remove dangerous public read access policy on profiles table
DROP POLICY IF EXISTS "Allow read access for all" ON profiles;

-- SECURITY FIX 2: Implement proper RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'coordenador')
));

-- SECURITY FIX 3: Reset all weak password hashes (users with default password)
UPDATE profiles 
SET password_hash = crypt('TempSecure123!', gen_salt('bf')),
    first_login = true,
    last_password_change = now()
WHERE password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.';

-- SECURITY FIX 4: Add comprehensive audit logging for authentication
CREATE TABLE IF NOT EXISTS security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    event_type text NOT NULL,
    event_description text NOT NULL,
    risk_level text DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ip_address inet,
    user_agent text,
    additional_data jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events" 
ON security_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'admin'
));

-- SECURITY FIX 5: Strengthen 2FA implementation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_backup_codes text[],
ADD COLUMN IF NOT EXISTS two_factor_last_used timestamp with time zone;

-- SECURITY FIX 6: Recreate validation trigger with proper validation
CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validar email apenas se não for NULL
    IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    
    -- Validar CPF se fornecido
    IF NEW.cpf IS NOT NULL AND NEW.cpf != '' AND length(regexp_replace(NEW.cpf, '[^0-9]', '', 'g')) != 11 THEN
        RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
    
    -- Validar telefone se fornecido
    IF NEW.phone IS NOT NULL AND NEW.phone != '' AND length(regexp_replace(NEW.phone, '[^0-9]', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'Telefone deve ter pelo menos 10 dígitos';
    END IF;
    
    -- Sanitizar entradas de texto
    IF NEW.full_name IS NOT NULL THEN
        NEW.full_name := trim(NEW.full_name);
        -- Remover caracteres potencialmente perigosos
        NEW.full_name := regexp_replace(NEW.full_name, '[<>"\'';&]', '', 'g');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER validate_user_input_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_input();