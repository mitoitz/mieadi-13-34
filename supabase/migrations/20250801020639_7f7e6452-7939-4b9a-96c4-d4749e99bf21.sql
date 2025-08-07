-- Completar permissões do perfil SECRETÁRIO
-- O secretário precisa de acesso para gestão administrativa, matrículas e certificados

-- Secretário pode gerenciar matrículas
CREATE POLICY "Secretários podem gerenciar matrículas"
ON public.enrollments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
));

-- Secretário pode gerenciar certificados  
CREATE POLICY "Secretários podem gerenciar certificados"
ON public.certificates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
));

-- Secretário pode gerenciar solicitações de membros
CREATE POLICY "Secretários podem gerenciar solicitações de membros"
ON public.member_requests
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
));

-- Secretário pode visualizar pagamentos
CREATE POLICY "Secretários podem visualizar pagamentos"
ON public.payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'secretario'
));

-- Secretário pode gerenciar profiles (para cadastros)
CREATE POLICY "Secretários podem gerenciar profiles"
ON public.profiles
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND p.role = 'secretario'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND p.role = 'secretario'
));

-- Completar permissões do perfil PASTOR
-- O pastor precisa de acesso para gestão de membros e congregação

-- Pastor pode gerenciar sua congregação
CREATE POLICY "Pastores podem gerenciar sua congregação"
ON public.congregations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode gerenciar membros de sua congregação
CREATE POLICY "Pastores podem gerenciar membros"
ON public.profiles
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND p.role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND p.role = 'pastor'
));

-- Pastor pode gerenciar indicações de membros
CREATE POLICY "Pastores podem gerenciar indicações"
ON public.member_indications
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode gerenciar solicitações de membros
CREATE POLICY "Pastores podem gerenciar solicitações de membros"
ON public.member_requests
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode gerenciar campos ministeriais
CREATE POLICY "Pastores podem gerenciar campos"
ON public.fields
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode gerenciar workflows de aprovação
CREATE POLICY "Pastores podem gerenciar aprovações"
ON public.approval_workflows
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode visualizar relatórios de presença
CREATE POLICY "Pastores podem visualizar presenças"
ON public.attendances
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));

-- Pastor pode visualizar eventos
CREATE POLICY "Pastores podem visualizar eventos"
ON public.events
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role = 'pastor'
));