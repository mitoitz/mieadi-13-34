-- Abordagem mais simples: apenas corrigir emails nulos e criar o diretor
UPDATE profiles SET email = 'temp_' || id || '@mieadi.com' WHERE email IS NULL OR email = '';

-- Criar o perfil do diretor se não existir
INSERT INTO profiles (
  id,
  full_name,
  email,
  cpf,
  role,
  status,
  created_at,
  updated_at,
  first_login,
  password_hash,
  terms_accepted,
  privacy_policy_accepted
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Mauro Administrador',
  'mauro.admin@mieadi.com',
  '12345678901',
  'diretor',
  'ativo',
  now(),
  now(),
  false,
  '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Configurar autenticação local
INSERT INTO auth_users_backup (
  profile_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'mauro.admin@mieadi.com',
  'Diretor2025!',
  now(),
  now(),
  now(),
  jsonb_build_object(
    'full_name', 'Mauro Administrador',
    'role', 'diretor'
  )
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  profile_id = EXCLUDED.profile_id,
  updated_at = now();

-- Verificar se foi criado corretamente
SELECT id, full_name, email, role FROM profiles WHERE email = 'mauro.admin@mieadi.com';