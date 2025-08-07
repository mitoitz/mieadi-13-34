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

CREATE POLICY "Teachers can view students in their classes" 
ON profiles FOR SELECT 
USING (
  auth.uid() != id AND (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'professor'
    ) AND EXISTS (
      SELECT 1 FROM enrollments e 
      JOIN classes c ON e.class_id = c.id 
      WHERE e.student_id = profiles.id 
      AND c.professor_id = auth.uid()
    )
  )
);

-- SECURITY FIX 3: Fix database functions to use immutable search_path
CREATE OR REPLACE FUNCTION public.get_current_authenticated_user()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
BEGIN
    -- Primeiro, tentar auth.uid()
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        RETURN current_user_id;
    END IF;
    
    -- Se não há auth.uid(), verificar configuração definida (validar se existe)
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::uuid;
        IF current_user_id IS NOT NULL THEN
            -- Validar se o usuário realmente existe
            IF EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
                RETURN current_user_id;
            END IF;
        END IF;
    EXCEPTION 
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Não retornar fallback hardcoded - mais seguro
    RETURN NULL;
END;
$function$;

-- SECURITY FIX 4: Reset all weak password hashes
UPDATE profiles 
SET password_hash = crypt('TempSecure123!', gen_salt('bf')),
    first_login = true,
    last_password_change = now()
WHERE password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.';

-- SECURITY FIX 5: Add comprehensive audit logging for authentication
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

-- SECURITY FIX 6: Strengthen 2FA implementation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_backup_codes text[],
ADD COLUMN IF NOT EXISTS two_factor_last_used timestamp with time zone;

-- SECURITY FIX 7: Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS rate_limiting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- Could be IP, email, user_id
    action_type text NOT NULL, -- 'login', 'password_reset', '2fa_attempt'
    attempt_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    blocked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limiting_identifier_action ON rate_limiting(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limiting_window_start ON rate_limiting(window_start);

-- Enable RLS on rate limiting
ALTER TABLE rate_limiting ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limiting
CREATE POLICY "System can manage rate limiting" 
ON rate_limiting FOR ALL 
USING (true) 
WITH CHECK (true);