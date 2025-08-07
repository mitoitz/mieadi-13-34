-- Sincronizar usuário do profiles para auth_users_backup
INSERT INTO auth_users_backup (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT 
  p.id,
  p.email,
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash da senha 'mudar123'
  NOW(),
  p.created_at,
  p.updated_at,
  jsonb_build_object(
    'full_name', p.full_name,
    'cpf', p.cpf,
    'role', p.role
  )
FROM profiles p 
WHERE p.email = 'FERNANDOBRITOSANTANA@GMAIL.COM'
  AND NOT EXISTS (
    SELECT 1 FROM auth_users_backup a 
    WHERE a.email = p.email
  );