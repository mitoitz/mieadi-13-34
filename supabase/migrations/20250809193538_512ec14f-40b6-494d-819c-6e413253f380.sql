-- RLS policies to allow INSERTs required by the UI for creating classes and linking subjects

-- Classes: allow admins/coordinators/secretaries or the class professor to insert
DROP POLICY IF EXISTS "Admins/coordinators/secretaries can insert classes" ON public.classes;
CREATE POLICY "Admins/coordinators/secretaries can insert classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_coordinator() OR
  is_secretary() OR
  professor_id = COALESCE(auth.uid(), get_current_authenticated_user())
);

-- Class Subjects: allow admins/coordinators/secretaries or the class professor to insert
DROP POLICY IF EXISTS "Admins/secretaries/teachers can insert class_subjects" ON public.class_subjects;
CREATE POLICY "Admins/secretaries/teachers can insert class_subjects"
ON public.class_subjects
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_coordinator() OR
  is_secretary() OR
  (class_id IN (
    SELECT id FROM classes WHERE professor_id = COALESCE(auth.uid(), get_current_authenticated_user())
  ))
);
