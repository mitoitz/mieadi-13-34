-- Dar permissões completas de frequência para o usuário CPF 04816954350
UPDATE public.profiles 
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'), 
  '{attendance}', 
  '{"read": true, "write": true, "delete": true, "manage": true, "reports": true, "bulk_actions": true, "mark_attendance": true, "view_all_attendances": true}'
)
WHERE cpf = '04816954350';

-- Verificar se a atualização foi bem-sucedida
SELECT full_name, cpf, role, permissions->'attendance' as attendance_permissions 
FROM public.profiles 
WHERE cpf = '04816954350';