-- Policies to enable INSERTs for profiles and attendance_records as requested

-- PROFILES: allow admins and coordinators to insert (directors/secretaries already allowed by existing policy)
DROP POLICY IF EXISTS "Admins and coordinators can insert profiles" ON public.profiles;
CREATE POLICY "Admins and coordinators can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_coordinator()
);

-- ATTENDANCE_RECORDS: allow students to insert their own records (self check-in)
DROP POLICY IF EXISTS "Students can insert own attendance_records" ON public.attendance_records;
CREATE POLICY "Students can insert own attendance_records"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = COALESCE(auth.uid(), get_current_authenticated_user())
);

-- ATTENDANCE_RECORDS: allow teachers to insert for their classes or events tied to their classes
DROP POLICY IF EXISTS "Teachers can insert attendance_records for their classes" ON public.attendance_records;
CREATE POLICY "Teachers can insert attendance_records for their classes"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  (
    class_id IN (
      SELECT id FROM classes WHERE professor_id = COALESCE(auth.uid(), get_current_authenticated_user())
    )
  )
  OR
  (
    event_id IN (
      SELECT e.id
      FROM events e
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE c.professor_id = COALESCE(auth.uid(), get_current_authenticated_user())
    )
  )
);

-- ATTENDANCE_RECORDS: allow admins/coordinators/secretaries to insert
DROP POLICY IF EXISTS "Admins can insert attendance_records" ON public.attendance_records;
CREATE POLICY "Admins can insert attendance_records"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_coordinator() OR is_secretary()
);
