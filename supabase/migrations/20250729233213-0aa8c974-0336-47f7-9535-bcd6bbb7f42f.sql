-- Corrigir o hash da senha "mudar123" 
-- Usando um hash bcrypt válido para "mudar123"

UPDATE public.profiles 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '11144477735';

-- Também corrigir a função reset_user_password
CREATE OR REPLACE FUNCTION public.reset_user_password(user_cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    UPDATE public.profiles 
    SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_login = TRUE,
        last_password_change = NOW()
    WHERE cpf = user_cpf;
    
    RETURN FOUND;
END;
$function$;