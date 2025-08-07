-- Fix type mismatch in get_people_paginated: cast profiles.status (text) to user_status
CREATE OR REPLACE FUNCTION public.get_people_paginated(
  page_offset integer DEFAULT 0,
  page_limit integer DEFAULT 100,
  search_term text DEFAULT ''::text
)
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
  field_name text,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    WITH total AS (
        SELECT COUNT(*) as count
        FROM profiles p
        WHERE 
            (search_term = '' OR search_term IS NULL) OR
            (p.full_name ILIKE '%' || search_term || '%') OR
            (p.cpf ILIKE '%' || search_term || '%') OR
            (p.email ILIKE '%' || search_term || '%') OR
            (p.qr_code ILIKE '%' || search_term || '%') OR
            (p.badge_number ILIKE '%' || search_term || '%')
    )
    SELECT 
        p.id,
        p.full_name,
        p.cpf,
        p.email,
        p.phone,
        p.role,
        (p.status)::user_status AS status,
        p.qr_code,
        p.badge_number,
        p.photo_url,
        c.name AS congregation_name,
        f.name AS field_name,
        total.count as total_count
    FROM profiles p
    LEFT JOIN congregations c ON p.congregation_id = c.id
    LEFT JOIN fields f ON p.field_id = f.id
    CROSS JOIN total
    WHERE 
        (search_term = '' OR search_term IS NULL) OR
        (p.full_name ILIKE '%' || search_term || '%') OR
        (p.cpf ILIKE '%' || search_term || '%') OR
        (p.email ILIKE '%' || search_term || '%') OR
        (p.qr_code ILIKE '%' || search_term || '%') OR
        (p.badge_number ILIKE '%' || search_term || '%')
    ORDER BY p.full_name
    LIMIT page_limit
    OFFSET page_offset;
$function$;

-- Fix type mismatch in get_all_people as well
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
        (p.status)::user_status AS status,
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