-- Melhorar função search_people para remover qualquer limite
CREATE OR REPLACE FUNCTION public.search_people(search_term text)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Debug: Log quantas pessoas existem
    RAISE NOTICE 'Total de profiles na tabela: %', (SELECT COUNT(*) FROM profiles);
    
    -- Retornar TODAS as pessoas sem limite
    RETURN QUERY
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
    WHERE 
        (search_term = '' OR search_term IS NULL) OR
        (p.full_name ILIKE '%' || search_term || '%') OR
        (p.cpf ILIKE '%' || search_term || '%') OR
        (p.email ILIKE '%' || search_term || '%') OR
        (p.qr_code ILIKE '%' || search_term || '%') OR
        (p.badge_number ILIKE '%' || search_term || '%')
    ORDER BY p.full_name;
    
    -- Debug: Log quantas pessoas estão sendo retornadas
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Pessoas retornadas pela função: %', result_count;
END;
$function$;

-- Também vamos criar uma função alternativa direta
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