-- Primeiro, remover ou corrigir emails duplicados/nulos
UPDATE profiles SET email = 'temp_' || id || '@mieadi.com' WHERE email IS NULL OR email = '';

-- Remover duplicatas, mantendo apenas o mais recente
WITH duplicates AS (
  SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) as rn
  FROM profiles 
  WHERE email IS NOT NULL AND email != ''
)
DELETE FROM profiles WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar a constraint única
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Inserir ou atualizar o perfil do diretor
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
) ON CONFLICT (email) DO UPDATE SET
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
  updated_at = now();