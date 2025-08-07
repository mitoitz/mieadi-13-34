-- Gerar um novo hash bcrypt válido para "mudar123"
-- Usando o comando bcrypt do Node.js: bcrypt.hashSync('mudar123', 10)

UPDATE public.profiles 
SET password_hash = '$2b$10$DsB/Ep8xf2JyNZYcWjz3oeGNOQ.3K7Z0qH8KJeGfJyqHKpKfHU22.',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '04816954350';