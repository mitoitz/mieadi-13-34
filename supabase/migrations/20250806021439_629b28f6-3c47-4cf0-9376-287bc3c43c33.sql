-- Atualizar função is_admin_user para incluir diretor
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('diretor', 'admin', 'coordenador', 'secretario')
  );
$function$;

-- Atualizar função is_admin_or_coordinator para incluir diretor
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    AND role IN ('diretor', 'admin', 'coordenador')
  );
$function$;