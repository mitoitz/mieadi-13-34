-- Clean up existing subjects RLS policies and create proper ones
DROP POLICY IF EXISTS "Admins, coordinators and secretaries can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Only admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can view subjects" ON public.subjects;

-- Create clear and consistent RLS policies for subjects table
CREATE POLICY "Anyone can view subjects" 
ON public.subjects 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and coordinators can manage subjects" 
ON public.subjects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )
);

CREATE POLICY "Teachers can manage subjects they are assigned to" 
ON public.subjects 
FOR ALL 
USING (
  professor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  professor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador', 'secretario')
  )
);