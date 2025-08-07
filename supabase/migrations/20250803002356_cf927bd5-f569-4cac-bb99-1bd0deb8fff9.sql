-- Primeiro, adicionar constraint única no email da tabela profiles
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Agora inserir o perfil do diretor com ON CONFLICT funcionando
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
  privacy_policy_accepted
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
  true
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now(),
  password_hash = EXCLUDED.password_hash;

-- Inserir na tabela auth_users_backup para autenticação
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
  updated_at = now();