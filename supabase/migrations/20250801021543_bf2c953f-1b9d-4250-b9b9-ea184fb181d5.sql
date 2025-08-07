-- Corrigir políticas problemáticas em outras tabelas que estão falhando

-- Enrollments: remover e recriar política para admins
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Secretários podem gerenciar matrículas" ON public.enrollments;

CREATE POLICY "Admins and coordinators can manage enrollments"
ON public.enrollments
FOR ALL
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());

CREATE POLICY "Secretaries can manage enrollments"
ON public.enrollments
FOR ALL
USING (is_secretary())
WITH CHECK (is_secretary());

-- Classes: verificar se há problema similar
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;

CREATE POLICY "Admins can manage all classes"
ON public.classes
FOR ALL
USING (is_admin_or_coordinator())
WITH CHECK (is_admin_or_coordinator());