-- Atualizar o perfil do usuário para diretor e configurar email
UPDATE profiles 
SET 
  role = 'diretor',
  email = 'diretor@mieadi.com.br',
  password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  first_login = false,
  terms_accepted = true,
  privacy_policy_accepted = true,
  updated_at = now()
WHERE cpf = '04816954350';

-- Inserir na tabela de backup de auth para permitir login por email
INSERT INTO auth_users_backup (
  profile_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '2105fb66-4072-4676-846d-bfb8dbe8734a',
  'diretor@mieadi.com.br',
  'Diretor123!',
  now(),
  now(),
  now(),
  jsonb_build_object(
    'full_name', 'MAURO ARRUDA DE ARRUDA',
    'cpf', '04816954350',
    'role', 'diretor'
  )
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = 'Diretor123!',
  updated_at = now();