-- Criar usuário admin no sistema de autenticação
-- Vamos usar a função admin do Supabase para criar o usuário

SELECT auth.admin_create_user(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'master@sistema.com',
  'Plc@112653',
  true, -- email_confirmed
  true, -- phone_confirmed  
  '{"full_name": "Usuário Master", "cpf": "048.169.543-50", "role": "admin"}'::jsonb
);