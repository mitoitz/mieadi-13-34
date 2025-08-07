-- Criar função alternativa mais simples para buscar todas as pessoas
CREATE OR REPLACE FUNCTION public.get_all_people()
RETURNS TABLE(
  id uuid, 
  full_name text, 
  cpf text, 
  email text, 
  phone text, 
  role user_role, 
  status user_status, 
  qr_code text, 
  badge_number text, 
  photo_url text, 
  congregation_name text, 
  field_name text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    ORDER BY p.full_name;
$function$;