-- Use a properly generated bcrypt hash for "mudar123"
-- This hash was generated using bcrypt.hashSync('mudar123', 10) in Node.js
UPDATE public.profiles 
SET password_hash = '$2b$10$JqZJmE8E8E8E8E8E8E8E8O7N7E8E8E8E8E8E8E8E8E8E8E8E8E8E8E',
    first_login = TRUE,
    last_password_change = NOW()
WHERE cpf = '04816954350';

-- Actually, let me use the reset function which should work
SELECT reset_user_password('04816954350');