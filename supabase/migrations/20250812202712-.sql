-- Atualizar perfil para CPF 04816954350: status ativo e role diretor
BEGIN;

UPDATE public.profiles
SET 
  role = 'diretor'::user_role,
  status = 'ativo'::user_status,
  updated_at = now()
WHERE cpf = '04816954350';

COMMIT;