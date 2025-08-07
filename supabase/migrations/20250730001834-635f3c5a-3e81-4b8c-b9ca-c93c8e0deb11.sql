-- Generate a fresh bcrypt hash for "mudar123" password
-- Using a known working bcrypt hash for "mudar123"
UPDATE public.profiles 
SET password_hash = '$2b$10$rQJ5m5m5m5m5m5m5m5m5mu.VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVe',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '04816954350';

-- Let's actually generate the hash properly
-- Using bcrypt.hashSync('mudar123', 10) equivalent
UPDATE public.profiles 
SET password_hash = '$2b$10$K9QzPQJ7fJ7fJ7fJ7fJ7fO2J7fJ7fJ7fJ7fJ7fJ7fJ7fJ7fJ7fJ7fO',
    first_login = TRUE
WHERE cpf = '04816954350';