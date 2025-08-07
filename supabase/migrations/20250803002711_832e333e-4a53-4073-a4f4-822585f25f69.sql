-- Remover perfis duplicados, mantendo apenas o diretor correto
DELETE FROM profiles WHERE email = 'mauro.admin@mieadi.com' AND id != '2105fb66-4072-4676-846d-bfb8dbe8734a';

-- Atualizar o perfil principal do diretor
UPDATE profiles 
SET 
  full_name = 'Mauro Administrador',
  role = 'diretor',
  cpf = '12345678901',
  status = 'ativo',
  password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
  terms_accepted = true,
  privacy_policy_accepted = true,
  first_login = false,
  updated_at = now()
WHERE id = '2105fb66-4072-4676-846d-bfb8dbe8734a';

-- Configurar autenticação local para o diretor
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

-- Corrigir os problemas de segurança das funções adicionando search_path
ALTER FUNCTION public.setup_director_supabase_auth() SET search_path TO 'public';
ALTER FUNCTION public.create_supabase_auth_for_profile(text, text) SET search_path TO 'public';
ALTER FUNCTION public.authenticate_admin_by_email(text, text) SET search_path TO 'public';
ALTER FUNCTION public.authenticate_by_email(text, text) SET search_path TO 'public';
ALTER FUNCTION public.create_admin_auth_users() SET search_path TO 'public';
ALTER FUNCTION public.create_auth_users_from_profiles() SET search_path TO 'public';
ALTER FUNCTION public.create_admin_users_in_auth() SET search_path TO 'public';

-- Verificar resultado final
SELECT id, full_name, email, role, cpf FROM profiles WHERE email = 'mauro.admin@mieadi.com';