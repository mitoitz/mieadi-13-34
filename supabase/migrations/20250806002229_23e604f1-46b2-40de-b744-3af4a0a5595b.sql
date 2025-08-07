-- =======================================
-- REMOÇÃO DE POLÍTICAS RLS NÃO UTILIZADAS
-- =======================================

-- 1. TABELA login_attempts: Não é utilizada no código, apenas referenciada no types.ts
-- Removendo todas as políticas RLS da tabela login_attempts
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;

-- 2. TABELA inter_profile_messages: Apenas definida no types.ts, não é usada ativamente
-- Mantendo as políticas pois há um hook useMessages que pode usar essa funcionalidade

-- 3. Políticas duplicadas ou muito específicas que podem ser simplificadas
-- Removendo política muito específica de assessment_submissions que permite inserção para qualquer um
DROP POLICY IF EXISTS "System can insert assessment submissions" ON public.assessment_submissions;

-- Removendo política muito permissiva de attendance_receipts
DROP POLICY IF EXISTS "System can generate receipts" ON public.attendance_receipts;

-- 4. Políticas redundantes em tables que não são críticas
-- Removendo política muito específica do professor para attendance_receipts (já coberta por admins)
DROP POLICY IF EXISTS "Teachers can view receipts from their classes" ON public.attendance_receipts;

-- 5. Política muito permissiva em attendance_records que permite qualquer operação
-- Removendo a política muito ampla e criando uma mais específica
DROP POLICY IF EXISTS "Authenticated users can manage attendance records" ON public.attendance_records;

-- Criando política mais específica para attendance_records
CREATE POLICY "Admins and teachers can manage attendance records" ON public.attendance_records
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador', 'secretario')
    ) OR 
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = attendance_records.class_id 
      AND professor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador', 'secretario')
    ) OR 
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = attendance_records.class_id 
      AND professor_id = auth.uid()
    )
  );

-- 6. Removendo política muito permissiva do attendances
DROP POLICY IF EXISTS "System can manage attendances" ON public.attendances;

-- 7. Simplificando política de class_subjects removendo a muito genérica
DROP POLICY IF EXISTS "Authenticated users can manage class subjects" ON public.class_subjects;

-- Criando política mais específica para class_subjects
CREATE POLICY "Admins and coordinators can manage class subjects" ON public.class_subjects
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
      AND role IN ('admin', 'coordenador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
      AND role IN ('admin', 'coordenador')
    )
  );

-- Permitindo visualização de class_subjects para todos os usuários autenticados
CREATE POLICY "Users can view class subjects" ON public.class_subjects
  FOR SELECT 
  USING (get_current_authenticated_user() IS NOT NULL);

-- =======================================
-- LIMPEZA COMPLETA
-- =======================================

-- Comentário: As tabelas que foram mantidas são aquelas que têm uso ativo no código:
-- - assessments, assessment_questions, assessment_submissions (sistema de avaliações)
-- - approval_workflows (sistema de aprovações)
-- - admin_logs (logs administrativos)
-- - auto_billing_rules, auto_billing_executions (automação financeira)
-- - auth_users_backup (autenticação customizada)

-- As políticas removidas eram muito permissivas ou redundantes