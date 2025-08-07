-- Em vez de deletar, vou atualizar o perfil existente principal
UPDATE profiles 
SET 
  full_name = 'Mauro Administrador',
  role = 'diretor',
  status = 'ativo',
  password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
  terms_accepted = true,
  privacy_policy_accepted = true,
  first_login = false,
  updated_at = now()
WHERE id = '2105fb66-4072-4676-846d-bfb8dbe8734a';

-- Mudar email dos outros perfis para evitar conflito
UPDATE profiles 
SET email = 'temp_' || id || '@mieadi.com' 
WHERE email = 'mauro.admin@mieadi.com' AND id != '2105fb66-4072-4676-846d-bfb8dbe8734a';

-- Configurar autenticação local para o diretor principal
INSERT INTO auth_users_backup (
  profile_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '2105fb66-4072-4676-846d-bfb8dbe8734a'::uuid,
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
  profile_id = '2105fb66-4072-4676-846d-bfb8dbe8734a'::uuid,
  updated_at = now();

-- Corrigir search_path das funções para segurança
ALTER FUNCTION public.setup_director_supabase_auth() SET search_path TO 'public';

-- Verificar o resultado
SELECT id, full_name, email, role, status FROM profiles WHERE email = 'mauro.admin@mieadi.com';