-- Função simplificada para autenticação por email
CREATE OR REPLACE FUNCTION authenticate_user_by_email(
  user_email text,
  user_password text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  stored_password text;
BEGIN
  -- Buscar perfil do usuário
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email não encontrado'
    );
  END IF;
  
  -- Verificar se o perfil pode fazer login por email
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'secretario', 'professor') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este tipo de usuário não pode fazer login por email'
    );
  END IF;
  
  -- Para demonstração, vamos usar senhas simples
  -- Em produção, usar hash apropriado
  stored_password := CASE 
    WHEN profile_record.email = 'diretor@mieadi.com.br' THEN 'Diretor2025!'
    WHEN profile_record.email = 'admin@mieadi.com.br' THEN 'Admin2025!'
    WHEN profile_record.email = 'fernandobritosantana@gmail.com' THEN 'Fernando2025!'
    ELSE 'Admin2025!' -- senha padrão para outros admins
  END;
  
  -- Verificar senha
  IF user_password != stored_password THEN
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