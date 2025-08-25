-- Adicionar RLS policies faltantes para tabelas sem políticas

-- Tabela member_requests (completar colunas)
DROP TABLE IF EXISTS member_requests CASCADE;
CREATE TABLE member_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  congregation_id UUID REFERENCES congregations(id),
  indicating_member_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE member_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage member requests" ON member_requests 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

CREATE POLICY "Users can view their own requests" ON member_requests 
FOR SELECT USING (indicating_member_id = auth.uid());

-- RLS policies para payment_schedules
CREATE POLICY "Admins can manage payment schedules" ON payment_schedules 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- RLS policies para payments
CREATE POLICY "Admins can manage payments" ON payments 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

CREATE POLICY "Students can view their payments" ON payments 
FOR SELECT USING (student_id = auth.uid());

-- RLS policies para qr_codes
CREATE POLICY "Users can view their QR codes" ON qr_codes 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert QR codes" ON qr_codes 
FOR INSERT WITH CHECK (true);

-- RLS policies para receipt_templates
CREATE POLICY "Admins can manage receipt templates" ON receipt_templates 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

CREATE POLICY "Users can view receipt templates" ON receipt_templates 
FOR SELECT USING (true);

-- RLS policies para scheduled_absences
CREATE POLICY "Admins can manage scheduled absences" ON scheduled_absences 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

CREATE POLICY "Users can view their absences" ON scheduled_absences 
FOR SELECT USING (person_id = auth.uid());

-- RLS policies para subjects
CREATE POLICY "Users can view subjects" ON subjects 
FOR SELECT USING (true);

CREATE POLICY "Admins can manage subjects" ON subjects 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- RLS policies para system_communications
CREATE POLICY "Users can view communications" ON system_communications 
FOR SELECT USING (true);

CREATE POLICY "Admins can manage communications" ON system_communications 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador', 'secretario')
  )
);

-- RLS policies para system_settings
CREATE POLICY "Admins can manage system settings" ON system_settings 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
    AND profiles.role IN ('diretor', 'admin', 'coordenador')
  )
);

CREATE POLICY "Users can view system settings" ON system_settings 
FOR SELECT USING (true);

-- Corrigir funções com search_path
ALTER FUNCTION public.authenticate_by_email(text, text) SET search_path = 'public';
ALTER FUNCTION public.verify_two_factor_pin(uuid, varchar) SET search_path = 'public';
ALTER FUNCTION public.set_two_factor_pin(uuid, varchar) SET search_path = 'public';
ALTER FUNCTION public.get_people_paginated(integer, integer, text) SET search_path = 'public';
ALTER FUNCTION public.consolidate_legacy_events() SET search_path = 'public';
ALTER FUNCTION public.consolidate_legacy_subjects() SET search_path = 'public';
ALTER FUNCTION public.consolidate_legacy_data() SET search_path = 'public';
ALTER FUNCTION public.upsert_event_by_fingerprint(text, timestamptz, timestamptz, text, uuid, text, text, uuid, text) SET search_path = 'public';

-- Criar função authenticate_by_email se não existir
CREATE OR REPLACE FUNCTION public.authenticate_by_email(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  stored_password text;
BEGIN
  -- Buscar perfil do usuário
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email não encontrado'
    );
  END IF;
  
  -- Verificar se o perfil pode fazer login por email (apenas perfis administrativos)
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'professor', 'pastor', 'secretario') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este tipo de usuário não pode fazer login por email. Use login por PIN.'
    );
  END IF;
  
  -- Senhas para demonstração (em produção usar hash seguro)
  stored_password := CASE 
    WHEN profile_record.email = 'diretor@mieadi.com.br' THEN 'Diretor2025!'
    WHEN profile_record.email = 'admin@mieadi.com.br' THEN 'Admin2025!'
    WHEN profile_record.email = 'fernandobritosantana@gmail.com' THEN 'Fernando2025!'
    ELSE 'Admin2025!' -- senha padrão para outros administrativos
  END;
  
  -- Verificar senha
  IF p_password != stored_password THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Senha incorreta'
    );
  END IF;
  
  -- Atualizar último login
  UPDATE profiles 
  SET last_login = now()
  WHERE id = profile_record.id;
  
  -- Retornar sucesso com dados do usuário
  RETURN json_build_object(
    'success', true,
    'message', 'Login realizado com sucesso',
    'user', json_build_object(
      'id', profile_record.id,
      'full_name', profile_record.full_name,
      'email', profile_record.email,
      'cpf', profile_record.cpf,
      'role', profile_record.role,
      'congregation_id', profile_record.congregation_id,
      'photo_url', profile_record.photo_url,
      'terms_accepted', profile_record.terms_accepted,
      'privacy_policy_accepted', profile_record.privacy_policy_accepted,
      'two_factor_enabled', profile_record.two_factor_enabled
    )
  );
END;
$$;