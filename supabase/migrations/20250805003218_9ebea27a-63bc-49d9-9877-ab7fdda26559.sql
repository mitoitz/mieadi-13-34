-- SECURITY FIX: Update all remaining functions to have proper search_path
-- Find and fix functions without search_path set

CREATE OR REPLACE FUNCTION public.set_default_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.auto_generate_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- SECURITY FIX: Add enhanced authentication logging
CREATE OR REPLACE FUNCTION public.log_authentication_event(
    p_user_id uuid,
    p_event_type text,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_additional_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO security_events (
        user_id,
        event_type,
        event_description,
        risk_level,
        ip_address,
        user_agent,
        additional_data
    ) VALUES (
        p_user_id,
        p_event_type,
        CASE 
            WHEN p_success THEN 'Authentication event: ' || p_event_type || ' - SUCCESS'
            ELSE 'Authentication event: ' || p_event_type || ' - FAILED'
        END,
        CASE 
            WHEN NOT p_success THEN 'HIGH'
            WHEN p_event_type IN ('password_reset', 'admin_login', 'privileged_action') THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        p_ip_address::inet,
        p_user_agent,
        p_additional_data || jsonb_build_object('success', p_success, 'timestamp', now())
    );
END;
$function$;