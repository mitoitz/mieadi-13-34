-- SECURITY FIX: Fix remaining database function security issues
-- Update all functions to have proper search_path settings

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN (
        SELECT role::text FROM profiles 
        WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'coordenador')
      )
    ELSE
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = get_current_authenticated_user() 
        AND role IN ('admin', 'coordenador')
      )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.is_secretary()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    AND role = 'secretario'::user_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_pastor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    AND role = 'pastor'::user_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_courses()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role IN ('diretor', 'coordenador', 'secretario') 
     FROM profiles 
     WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
     LIMIT 1),
    false
  );
$function$;

-- SECURITY FIX: Add rate limiting function with proper search path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier text,
    p_action_type text,
    p_max_attempts integer DEFAULT 5,
    p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_attempts integer;
    window_start timestamp with time zone;
BEGIN
    -- Clean up expired rate limit records
    DELETE FROM rate_limiting 
    WHERE window_start < (now() - interval '1 hour');
    
    -- Check current attempts within window
    SELECT attempt_count, window_start 
    INTO current_attempts, window_start
    FROM rate_limiting 
    WHERE identifier = p_identifier 
    AND action_type = p_action_type 
    AND window_start > (now() - (p_window_minutes || ' minutes')::interval)
    ORDER BY window_start DESC 
    LIMIT 1;
    
    -- If no recent attempts, allow and create new record
    IF current_attempts IS NULL THEN
        INSERT INTO rate_limiting (identifier, action_type, attempt_count, window_start)
        VALUES (p_identifier, p_action_type, 1, now());
        RETURN true;
    END IF;
    
    -- If under limit, increment and allow
    IF current_attempts < p_max_attempts THEN
        UPDATE rate_limiting 
        SET attempt_count = attempt_count + 1,
            updated_at = now()
        WHERE identifier = p_identifier 
        AND action_type = p_action_type 
        AND window_start = window_start;
        RETURN true;
    END IF;
    
    -- Over limit, block
    UPDATE rate_limiting 
    SET blocked_until = now() + (p_window_minutes || ' minutes')::interval,
        updated_at = now()
    WHERE identifier = p_identifier 
    AND action_type = p_action_type 
    AND window_start = window_start;
    
    RETURN false;
END;
$function$;