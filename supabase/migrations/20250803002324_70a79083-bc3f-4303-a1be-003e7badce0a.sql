-- Primeiro, vamos verificar se já existe um perfil de diretor
SELECT id, full_name, email, role FROM profiles WHERE role = 'diretor' LIMIT 5;

-- Criar ou atualizar o perfil do diretor principal
INSERT INTO profiles (
  id,
  full_name,
  email,
  cpf,
  role,
  status,
  congregation_id,
  created_at,
  updated_at,
  first_login,
  password_hash,
  terms_accepted,
  privacy_policy_accepted,
  qr_code,
  badge_number
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Mauro Administrador',
  'mauro.admin@mieadi.com',
  '12345678901',
  'diretor',
  'ativo',
  (SELECT id FROM congregations LIMIT 1),
  now(),
  now(),
  false,
  '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.', -- senha: mudar123
  true,
  true,
  generate_qr_code(),
  generate_badge_number()
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now(),
  password_hash = EXCLUDED.password_hash;

-- Criar função para configurar conta Supabase Auth automaticamente
CREATE OR REPLACE FUNCTION setup_director_supabase_auth()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  director_profile profiles%ROWTYPE;
  temp_password TEXT := 'Diretor2025!';
  result JSON;
BEGIN
  -- Buscar o perfil do diretor
  SELECT * INTO director_profile 
  FROM profiles 
  WHERE email = 'mauro.admin@mieadi.com' AND role = 'diretor';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Perfil do diretor não encontrado'
    );
  END IF;
  
  -- Atualizar senha do perfil
  UPDATE profiles 
  SET 
    password_hash = crypt(temp_password, gen_salt('bf')),
    first_login = false,
    last_password_change = NOW(),
    email_confirmed_at = NOW()
  WHERE id = director_profile.id;
  
  -- Registrar na tabela de backup para autenticação local
  INSERT INTO auth_users_backup (
    profile_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    director_profile.id,
    director_profile.email,
    temp_password,
    now(),
    now(),
    now(),
    jsonb_build_object(
      'full_name', director_profile.full_name,
      'role', director_profile.role
    )
  ) ON CONFLICT (email) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Diretor configurado com sucesso',
    'email', director_profile.email,
    'password', temp_password,
    'user_id', director_profile.id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Erro ao configurar diretor: ' || SQLERRM
    );
END;
$$;

-- Executar a configuração
SELECT setup_director_supabase_auth();