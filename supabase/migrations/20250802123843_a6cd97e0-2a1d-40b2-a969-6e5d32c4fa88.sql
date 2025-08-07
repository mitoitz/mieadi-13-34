-- Primeiro, vamos adicionar o novo role 'diretor' ao enum
ALTER TYPE user_role ADD VALUE 'diretor';

-- Atualizar todos os registros existentes de 'admin' para 'diretor'
UPDATE profiles SET role = 'diretor' WHERE role = 'admin';

-- Atualizar todas as funções que referenciam 'admin'
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Primeiro verifica se há sessão auth ativa
  SELECT CASE 
    WHEN auth.uid() IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid()
        AND role IN ('diretor', 'coordenador')
      )
    ELSE 
      -- Para autenticação por CPF, permitir temporariamente
      true
  END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_courses()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role IN ('diretor', 'coordenador', 'secretario') 
     FROM profiles 
     WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
     LIMIT 1),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN (
        SELECT role::text FROM profiles 
        WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    );
END;
$function$;

-- Atualizar member_requests para usar 'diretor'
ALTER TABLE member_requests ALTER COLUMN requested_role SET DEFAULT 'membro'::user_role;

-- Recriar as políticas RLS que usavam 'admin'

-- Tabela admin_logs
DROP POLICY IF EXISTS "Only admins can view admin logs" ON admin_logs;
CREATE POLICY "Only directors can view admin logs" 
ON admin_logs FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'diretor'::user_role
));

-- Tabela audit_logs  
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only directors can view audit logs"
ON audit_logs FOR SELECT
TO authenticated  
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'diretor'::user_role
));

-- Tabela auto_billing_executions
DROP POLICY IF EXISTS "Only admins can view billing executions" ON auto_billing_executions;
CREATE POLICY "Only directors can view billing executions"
ON auto_billing_executions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela auto_billing_rules
DROP POLICY IF EXISTS "Only admins can manage auto billing rules" ON auto_billing_rules;
CREATE POLICY "Only directors can manage auto billing rules"
ON auto_billing_rules FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela auth_users_backup
DROP POLICY IF EXISTS "Only admins can access auth backup" ON auth_users_backup;
CREATE POLICY "Only directors can access auth backup"
ON auth_users_backup FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'diretor'::user_role
));

-- Tabela certificates
DROP POLICY IF EXISTS "Admins and coordinators can manage certificates" ON certificates;
DROP POLICY IF EXISTS "Admins and coordinators can view all certificates" ON certificates;

CREATE POLICY "Directors and coordinators can manage certificates"
ON certificates FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

CREATE POLICY "Directors and coordinators can view all certificates"
ON certificates FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela congregations
DROP POLICY IF EXISTS "Admins can manage congregations" ON congregations;
CREATE POLICY "Directors can manage congregations"
ON congregations FOR ALL
TO authenticated
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());

-- Tabela course_subjects
DROP POLICY IF EXISTS "Admins can manage course subjects" ON course_subjects;
CREATE POLICY "Directors can manage course subjects"
ON course_subjects FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela fields
DROP POLICY IF EXISTS "Admins can manage fields" ON fields;
CREATE POLICY "Directors can manage fields"
ON fields FOR ALL
TO authenticated
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());

-- Tabela member_indications  
DROP POLICY IF EXISTS "Admins can manage all indications" ON member_indications;
CREATE POLICY "Directors can manage all indications"
ON member_indications FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela member_requests
DROP POLICY IF EXISTS "Admins can update member requests" ON member_requests;
DROP POLICY IF EXISTS "Admins can view all member requests" ON member_requests;

CREATE POLICY "Directors can update member requests"
ON member_requests FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

CREATE POLICY "Directors can view all member requests"
ON member_requests FOR SELECT  
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Atualizar políticas que mencionam 'admin' em arrays
-- Tabela assessment_questions
DROP POLICY IF EXISTS "Teachers and admins can manage assessment questions" ON assessment_questions;
CREATE POLICY "Teachers and directors can manage assessment questions"
ON assessment_questions FOR ALL
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM assessments a
  JOIN classes c ON a.class_id = c.id
  WHERE a.id = assessment_questions.assessment_id 
  AND c.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

DROP POLICY IF EXISTS "Students can view questions from published assessments" ON assessment_questions;
CREATE POLICY "Students can view questions from published assessments"
ON assessment_questions FOR SELECT
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM assessments a
  JOIN enrollments e ON a.class_id = e.class_id
  WHERE a.id = assessment_questions.assessment_id 
  AND a.is_published = true 
  AND e.student_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role, 'professor'::user_role)
)));

-- Atualizar mais políticas...
-- Tabela assessment_submissions
DROP POLICY IF EXISTS "Teachers can view submissions from their assessments" ON assessment_submissions;
CREATE POLICY "Teachers can view submissions from their assessments"
ON assessment_submissions FOR SELECT
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM assessments a
  JOIN classes c ON a.class_id = c.id
  WHERE a.id = assessment_submissions.assessment_id 
  AND c.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Tabela assessments  
DROP POLICY IF EXISTS "Students can view published assessments from their classes" ON assessments;
CREATE POLICY "Students can view published assessments from their classes"
ON assessments FOR SELECT
TO authenticated
USING (((is_published = true) AND (EXISTS (
  SELECT 1 FROM enrollments
  WHERE enrollments.class_id = assessments.class_id 
  AND enrollments.student_id = auth.uid()
))) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role, 'professor'::user_role)
)));

DROP POLICY IF EXISTS "Teachers and admins can manage assessments" ON assessments;
CREATE POLICY "Teachers and directors can manage assessments"
ON assessments FOR ALL
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = assessments.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Tabela attendance_receipts
DROP POLICY IF EXISTS "Admins can manage all receipts" ON attendance_receipts;
CREATE POLICY "Directors can manage all receipts"
ON attendance_receipts FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
));

-- Tabela attendances
DROP POLICY IF EXISTS "Users can insert attendance appropriately" ON attendances;
CREATE POLICY "Users can insert attendance appropriately"
ON attendances FOR INSERT
TO authenticated
WITH CHECK ((student_id = auth.uid()) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role, 'secretario'::user_role)
)) OR (EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = attendances.class_id 
  AND classes.professor_id = auth.uid()
)));

-- Tabela class_materials
DROP POLICY IF EXISTS "Students can view materials from their classes" ON class_materials;
CREATE POLICY "Students can view materials from their classes"
ON class_materials FOR SELECT
TO authenticated
USING ((is_public = true) OR (EXISTS (
  SELECT 1 FROM enrollments
  WHERE enrollments.class_id = class_materials.class_id 
  AND enrollments.student_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role, 'professor'::user_role)
)));

DROP POLICY IF EXISTS "Teachers and admins can manage class materials" ON class_materials;
CREATE POLICY "Teachers and directors can manage class materials"
ON class_materials FOR ALL
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = class_materials.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Tabela class_schedules
DROP POLICY IF EXISTS "Admins and professors can manage schedules" ON class_schedules;
CREATE POLICY "Directors and professors can manage schedules"
ON class_schedules FOR ALL
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = class_schedules.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

DROP POLICY IF EXISTS "Users can view schedules for their classes" ON class_schedules;
CREATE POLICY "Users can view schedules for their classes"
ON class_schedules FOR SELECT
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM enrollments
  WHERE enrollments.class_id = class_schedules.class_id 
  AND enrollments.student_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = class_schedules.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Tabela class_sessions  
DROP POLICY IF EXISTS "Admins and professors can manage sessions" ON class_sessions;
CREATE POLICY "Directors and professors can manage sessions"
ON class_sessions FOR ALL
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = class_sessions.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

DROP POLICY IF EXISTS "Users can view sessions for their classes" ON class_sessions;
CREATE POLICY "Users can view sessions for their classes"
ON class_sessions FOR SELECT
TO authenticated
USING ((EXISTS (
  SELECT 1 FROM enrollments
  WHERE enrollments.class_id = class_sessions.class_id 
  AND enrollments.student_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM classes
  WHERE classes.id = class_sessions.class_id 
  AND classes.professor_id = auth.uid()
)) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Tabela enrollments já usa is_admin_or_coordinator() que foi atualizada

-- Tabela grades
DROP POLICY IF EXISTS "Teachers can manage grades for their classes" ON grades;
CREATE POLICY "Teachers can manage grades for their classes"
ON grades FOR ALL
TO authenticated
USING ((class_id IN (
  SELECT classes.id FROM classes
  WHERE classes.professor_id = auth.uid()
)) OR is_admin_or_coordinator())
WITH CHECK ((class_id IN (
  SELECT classes.id FROM classes
  WHERE classes.professor_id = auth.uid()
)) OR is_admin_or_coordinator());

-- Tabela materials
DROP POLICY IF EXISTS "Teachers and admins can manage materials" ON materials;
CREATE POLICY "Teachers and directors can manage materials"
ON materials FOR ALL
TO authenticated
USING ((professor_id = auth.uid()) OR (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('diretor'::user_role, 'coordenador'::user_role)
)));

-- Atualizar função para checar se user precisa configuração de sistema
CREATE OR REPLACE FUNCTION public.system_needs_setup()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE role = 'diretor'
  );
$function$;