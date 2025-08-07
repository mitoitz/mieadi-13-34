-- Corrigir o hash da senha "mudar123" para o CPF 04816954350
-- Usando o hash bcrypt correto para "mudar123"

UPDATE public.profiles 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '04816954350';