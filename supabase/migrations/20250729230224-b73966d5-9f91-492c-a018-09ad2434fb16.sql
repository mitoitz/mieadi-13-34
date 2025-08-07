-- Atualizar senha do usuário admin para "mudar123"
-- Hash gerado com bcrypt para "mudar123": $2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.
UPDATE public.profiles 
SET password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
    first_login = true,
    updated_at = now()
WHERE cpf = '048.169.543-50';