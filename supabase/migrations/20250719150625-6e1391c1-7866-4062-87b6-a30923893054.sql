-- Criar políticas RLS para as novas tabelas

-- Políticas para tabela events
CREATE POLICY "Users can view events from their classes" ON public.events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.class_id = events.class_id 
    AND enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = events.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

CREATE POLICY "Teachers and admins can manage events" ON public.events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = events.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

-- Políticas para tabela materials
CREATE POLICY "Users can view public materials or materials from their subjects" ON public.materials
FOR SELECT USING (
  is_public = true OR
  professor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

CREATE POLICY "Teachers and admins can manage materials" ON public.materials
FOR ALL USING (
  professor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

-- Políticas para tabela certificates
CREATE POLICY "Students can view their own certificates" ON public.certificates
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins and coordinators can view all certificates" ON public.certificates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

CREATE POLICY "Admins and coordinators can manage certificates" ON public.certificates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

-- Políticas para tabela assessment_submissions
CREATE POLICY "Students can manage their own submissions" ON public.assessment_submissions
FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions from their assessments" ON public.assessment_submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assessments a
    JOIN public.classes c ON a.class_id = c.id
    WHERE a.id = assessment_submissions.assessment_id 
    AND c.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

-- Políticas para tabela system_communications
CREATE POLICY "Users can view communications targeted to them" ON public.system_communications
FOR SELECT USING (
  target_audience = 'all' OR
  (auth.uid() = ANY(read_by)) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND (
      profiles.role::text = ANY(target_roles) OR
      profiles.congregation_id = ANY(target_congregations)
    )
  )
);

CREATE POLICY "Admins can manage all communications" ON public.system_communications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);

-- Políticas para tabela attendance_records
CREATE POLICY "Students can view their own attendance records" ON public.attendance_records
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers and admins can manage attendance records" ON public.attendance_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = attendance_records.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  verified_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'coordenador'::user_role])
  )
);