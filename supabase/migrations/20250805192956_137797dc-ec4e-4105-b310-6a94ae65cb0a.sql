-- Criar usuários de autenticação para os administradores existentes
-- Função para criar conta de autenticação para perfis administrativos

-- Primeiro, vamos criar uma função que permite login por email/senha para administradores
CREATE OR REPLACE FUNCTION create_admin_auth_user(
  user_email text,
  user_password text DEFAULT 'MieadiAdmin2025!'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Buscar o perfil
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Usuário não encontrado na tabela profiles'
    );
  END IF;
  
  -- Verificar se o usuário pode usar login por email (perfis administrativos)
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'secretario', 'professor') THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Este perfil de usuário não pode usar login por email'
    );
  END IF;
  
  -- Inserir ou atualizar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    profile_record.id,
    'authenticated',
    'authenticated',
    profile_record.email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object(
      'full_name', profile_record.full_name,
      'role', profile_record.role
    ),
    false,
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt(user_password, gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW(),
    raw_user_meta_data = jsonb_build_object(
      'full_name', profile_record.full_name,
      'role', profile_record.role
    );
    
  -- Criar registro de identidade
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    profile_record.id,
    profile_record.id,
    jsonb_build_object(
      'sub', profile_record.id,
      'email', profile_record.email
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, user_id) DO UPDATE SET
    last_sign_in_at = NOW(),
    updated_at = NOW();
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Conta de autenticação criada/atualizada com sucesso',
    'user_id', profile_record.id,
    'email', profile_record.email,
    'password', user_password
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Erro ao criar conta de autenticação: ' || SQLERRM
    );
END;
$$;

-- Criar contas de autenticação para os administradores principais
SELECT create_admin_auth_user('diretor@mieadi.com.br', 'Diretor2025!');
SELECT create_admin_auth_user('admin@mieadi.com.br', 'Admin2025!');
SELECT create_admin_auth_user('fernandobritosantana@gmail.com', 'Fernando2025!');