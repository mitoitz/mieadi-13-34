-- Corrigir o hash da senha para "mudar123" e a função reset_user_password
-- Hash correto para "mudar123": $2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.

-- Primeiro, atualizar o usuário específico com o hash correto
UPDATE public.profiles 
SET password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '04816954350';

-- Corrigir a função reset_user_password com o hash correto
CREATE OR REPLACE FUNCTION public.reset_user_password(user_cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    UPDATE public.profiles 
    SET password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
        first_login = TRUE,
        last_password_change = NOW()
    WHERE cpf = user_cpf;
    
    RETURN FOUND;
END;
$function$;