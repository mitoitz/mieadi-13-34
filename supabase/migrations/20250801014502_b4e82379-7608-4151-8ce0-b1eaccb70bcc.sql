-- Fix search_path in functions and create comprehensive permission system
SET search_path TO public;

-- Create user_role enum if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'coordenador', 'professor', 'aluno', 'pastor', 'secretario', 'membro');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create user_status enum if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE user_status AS ENUM ('ativo', 'inativo', 'suspenso', 'pendente');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Fix search_path in existing functions
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_code := 'QR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
        
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE qr_code = new_code
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_badge_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    next_number integer;
    new_badge_number text;
BEGIN
    -- Buscar o maior número atual e adicionar 1
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(p.badge_number, '[^0-9]', '', 'g') AS integer)), 0) + 1
    INTO next_number
    FROM profiles p
    WHERE p.badge_number IS NOT NULL 
    AND p.badge_number ~ '^[0-9]+$';
    
    -- Se não encontrou nenhum número, começar com 1001
    IF next_number <= 1000 THEN
        next_number := 1001;
    END IF;
    
    -- Formatar com zeros à esquerda (6 dígitos)
    new_badge_number := LPAD(next_number::text, 6, '0');
    
    RETURN new_badge_number;
END;
$$;

-- Update profiles table structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'membro',
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS congregation_id uuid REFERENCES congregations(id),
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS absence_start_date date,
ADD COLUMN IF NOT EXISTS absence_end_date date,
ADD COLUMN IF NOT EXISTS is_absent boolean DEFAULT false;

-- Create permission helper functions
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'professor'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_permission(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = required_role
  );
$$;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (is_admin_or_coordinator());

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (is_admin_or_coordinator());

CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- Update classes table RLS
DROP POLICY IF EXISTS "Admins and coordinators can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;
DROP POLICY IF EXISTS "Users can view accessible classes" ON public.classes;

CREATE POLICY "Admins can manage all classes" 
ON public.classes FOR ALL 
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());

CREATE POLICY "Teachers can manage their classes" 
ON public.classes FOR ALL 
USING (professor_id = auth.uid() OR is_admin_or_coordinator())
WITH CHECK (professor_id = auth.uid() OR is_admin_or_coordinator());

CREATE POLICY "Students can view their classes" 
ON public.classes FOR SELECT 
USING (
  id IN (
    SELECT class_id FROM enrollments 
    WHERE student_id = auth.uid()
  ) OR 
  professor_id = auth.uid() OR 
  is_admin_or_coordinator()
);

-- Update enrollments table RLS
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their enrollments" ON public.enrollments;

CREATE POLICY "Admins can manage enrollments" 
ON public.enrollments FOR ALL 
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());

CREATE POLICY "Students can view their enrollments" 
ON public.enrollments FOR SELECT 
USING (
  student_id = auth.uid() OR 
  class_id IN (
    SELECT id FROM classes 
    WHERE professor_id = auth.uid()
  ) OR 
  is_admin_or_coordinator()
);

-- Update grades table RLS
DROP POLICY IF EXISTS "Students can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers and admins can manage grades" ON public.grades;

CREATE POLICY "Students can view their grades" 
ON public.grades FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage grades for their classes" 
ON public.grades FOR ALL 
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE professor_id = auth.uid()
  ) OR 
  is_admin_or_coordinator()
)
WITH CHECK (
  class_id IN (
    SELECT id FROM classes 
    WHERE professor_id = auth.uid()
  ) OR 
  is_admin_or_coordinator()
);

-- Create trigger for auto-generating profile data
CREATE OR REPLACE FUNCTION public.auto_generate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Generate QR code if not provided
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    
    -- Generate badge number if not provided
    IF NEW.badge_number IS NULL THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    
    -- Set default role if not provided
    IF NEW.role IS NULL THEN
        NEW.role := 'membro';
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL THEN
        NEW.status := 'ativo';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_generate_profile_data_trigger ON public.profiles;
CREATE TRIGGER auto_generate_profile_data_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_profile_data();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_congregation ON public.profiles(congregation_id);
CREATE INDEX IF NOT EXISTS idx_classes_professor ON public.classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON public.grades(class_id);

-- Create system setup verification function
CREATE OR REPLACE FUNCTION public.system_needs_setup()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE role = 'admin'
  );
$$;