-- Completar apenas RLS policies para tabelas existentes e corrigir funções

-- RLS policies para payments (tabela existente)
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

-- RLS policies para qr_codes (tabela existente)
CREATE POLICY "Users can view their QR codes" ON qr_codes 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert QR codes" ON qr_codes 
FOR INSERT WITH CHECK (true);

-- RLS policies para receipt_templates (tabela existente)
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

-- RLS policies para scheduled_absences (tabela existente)
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

-- RLS policies para subjects (tabela existente)
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

-- RLS policies para system_communications (tabela existente)
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

-- RLS policies para system_settings (tabela existente)
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
DO $$
BEGIN
  -- Só alterar se a função existir
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'authenticate_by_email') THEN
    ALTER FUNCTION public.authenticate_by_email(text, text) SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'verify_two_factor_pin') THEN
    ALTER FUNCTION public.verify_two_factor_pin(uuid, varchar) SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'set_two_factor_pin') THEN
    ALTER FUNCTION public.set_two_factor_pin(uuid, varchar) SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_people_paginated') THEN
    ALTER FUNCTION public.get_people_paginated(integer, integer, text) SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'consolidate_legacy_events') THEN
    ALTER FUNCTION public.consolidate_legacy_events() SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'consolidate_legacy_subjects') THEN
    ALTER FUNCTION public.consolidate_legacy_subjects() SET search_path = 'public';
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'consolidate_legacy_data') THEN
    ALTER FUNCTION public.consolidate_legacy_data() SET search_path = 'public';
  END IF;
END $$;

-- Garantir que a função authenticate_by_email existe e funciona
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