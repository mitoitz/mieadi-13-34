-- Corrigir warnings de segurança: Function Search Path Mutable
-- Adicionar SET search_path TO 'public' nas funções que estão faltando

-- Função is_pastor
CREATE OR REPLACE FUNCTION public.is_pastor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'pastor'::user_role
  );
$function$;

-- Função is_secretary
CREATE OR REPLACE FUNCTION public.is_secretary()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'secretario'::user_role
  );
$function$;

-- Função is_teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'professor'::user_role
  );
$function$;

-- Função can_manage_courses
CREATE OR REPLACE FUNCTION public.can_manage_courses()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin'::user_role, 'coordenador'::user_role, 'secretario'::user_role)
  );
$function$;

-- Função has_role_permission
CREATE OR REPLACE FUNCTION public.has_role_permission(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = required_role
  );
$function$;

-- Função user_has_permission
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_path text, action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (profiles.permissions #> string_to_array(permission_path || '.' || action, '.'))::boolean,
    (role_perms.permissions #> string_to_array(permission_path || '.' || action, '.'))::boolean,
    false
  )
  FROM profiles
  LEFT JOIN role_permissions role_perms ON role_perms.role = profiles.role
  WHERE profiles.id = auth.uid();
$function$;

-- Função get_current_user_role
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