-- Segunda parte: Atualizar registros e funções agora que o enum foi criado
-- Atualizar todos os registros existentes de 'admin' para 'diretor'
UPDATE profiles SET role = 'diretor' WHERE role = 'admin';

-- Atualizar todas as funções que referenciam 'admin'
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Primeiro verifica se há sessão auth ativa
  SELECT CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid()
        AND role IN ('diretor', 'coordenador')
      )
    ELSE 
      -- Para autenticação por CPF, permitir temporariamente
      true
  END;
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

-- Atualizar função para checar se user precisa configuração de sistema
CREATE OR REPLACE FUNCTION public.system_needs_setup()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE role = 'diretor'
  );
$function$;