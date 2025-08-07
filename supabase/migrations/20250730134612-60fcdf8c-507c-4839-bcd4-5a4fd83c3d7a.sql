-- Alterar o usuário com CPF 048.169.543-50 para administrador
UPDATE public.profiles 
SET role = 'admin'::user_role,
    status = 'ativo'::user_status,
    updated_at = NOW()
WHERE cpf = '04816954350';