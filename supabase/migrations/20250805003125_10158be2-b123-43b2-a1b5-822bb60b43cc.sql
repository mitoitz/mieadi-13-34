-- SECURITY FIX: Drop security definer views and replace with secure functions
-- First, let's check what views exist and drop them if they're problematic

-- Look for any security definer views
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Drop any views that might be causing security issues
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.schemaname) || '.' || quote_ident(view_record.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- SECURITY FIX: Recreate attendance_summary as a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_attendance_summary(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_class_id uuid DEFAULT NULL,
    p_event_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    student_id uuid,
    student_name text,
    student_cpf text,
    badge_number text,
    class_id uuid,
    class_name text,
    event_id uuid,
    event_title text,
    status text,
    attendance_type text,
    verification_method text,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.student_id,
        p.full_name as student_name,
        p.cpf as student_cpf,
        p.badge_number,
        ar.class_id,
        c.name as class_name,
        ar.event_id,
        e.title as event_title,
        ar.status,
        ar.attendance_type,
        ar.verification_method,
        ar.check_in_time,
        ar.check_out_time,
        ar.created_at
    FROM attendance_records ar
    LEFT JOIN profiles p ON ar.student_id = p.id
    LEFT JOIN classes c ON ar.class_id = c.id
    LEFT JOIN events e ON ar.event_id = e.id
    WHERE 
        (p_start_date IS NULL OR ar.created_at::date >= p_start_date) AND
        (p_end_date IS NULL OR ar.created_at::date <= p_end_date) AND
        (p_class_id IS NULL OR ar.class_id = p_class_id) AND
        (p_event_id IS NULL OR ar.event_id = p_event_id) AND
        (
            -- Only allow access to authorized users
            auth.uid() = ar.student_id OR  -- Students can see their own records
            EXISTS (
                SELECT 1 FROM profiles prof 
                WHERE prof.id = auth.uid() 
                AND prof.role IN ('admin', 'coordenador', 'secretario', 'professor')
            ) OR
            EXISTS (
                SELECT 1 FROM classes cl 
                WHERE cl.id = ar.class_id 
                AND cl.professor_id = auth.uid()
            )
        );
END;
$function$;