-- Fix RLS policies and database relationships

-- 1. Fix attendance_records RLS policies
DROP POLICY IF EXISTS "Students can view their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance records" ON public.attendance_records;

CREATE POLICY "Users can view attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage attendance records" 
ON public.attendance_records 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 2. Fix classes RLS policies
DROP POLICY IF EXISTS "Admins and coordinators can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;

CREATE POLICY "Users can view classes" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage classes" 
ON public.classes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Fix PIN verification function
CREATE OR REPLACE FUNCTION public.verify_user_pin(user_id uuid, pin_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  -- Validar PIN (4 dígitos)
  IF pin_code !~ '^\d{4}$' THEN
    RETURN false;
  END IF;
  
  -- Buscar PIN armazenado (usando two_factor_pin em vez de two_factor_secret)
  SELECT two_factor_pin INTO stored_pin
  FROM profiles 
  WHERE id = user_id AND two_factor_enabled = true;
  
  -- Se não encontrou o usuário ou PIN não configurado
  IF stored_pin IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o PIN está correto (comparação direta)
  RETURN stored_pin = pin_code;
END;
$$;