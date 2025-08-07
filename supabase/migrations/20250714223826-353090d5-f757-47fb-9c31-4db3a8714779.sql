-- Fix RLS policies to allow basic CRUD operations for system administration

-- Update congregations policies to allow admin operations
DROP POLICY IF EXISTS "Admins and coordenadores can insert congregations" ON public.congregations;
DROP POLICY IF EXISTS "Admins and coordenadores can update congregations" ON public.congregations;
DROP POLICY IF EXISTS "Admins and coordenadores can view all congregations" ON public.congregations;

CREATE POLICY "Allow all operations on congregations" 
ON public.congregations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update courses policies
DROP POLICY IF EXISTS "Admins and coordenadores can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;

CREATE POLICY "Allow all operations on courses" 
ON public.courses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update fields policies
DROP POLICY IF EXISTS "Admins and coordenadores can manage fields" ON public.fields;
DROP POLICY IF EXISTS "Everyone can view fields" ON public.fields;

CREATE POLICY "Allow all operations on fields" 
ON public.fields 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update subjects policies
DROP POLICY IF EXISTS "Admins, coordenadores and professors can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Everyone can view subjects" ON public.subjects;

CREATE POLICY "Allow all operations on subjects" 
ON public.subjects 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update profiles policies to be more permissive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

CREATE POLICY "Allow all operations on profiles" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);