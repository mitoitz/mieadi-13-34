-- Atualizar o CPF do usuário master para um CPF válido para teste
-- CPF 11144477735 é um CPF válido para testes

UPDATE public.profiles 
SET cpf = '11144477735'
WHERE cpf = '048.169.543-50';