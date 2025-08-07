-- Verificar usuário e atualizar para admin
SELECT id, full_name, email, cpf, role FROM profiles WHERE cpf = '04624147367' OR cpf = '046.241.473-67' OR cpf LIKE '%046%241%473%67%';

-- Atualizar qualquer usuário com CPF similar para administrador
UPDATE public.profiles 
SET role = 'admin'::user_role,
    updated_at = now()
WHERE cpf IN ('04624147367', '046.241.473-67') 
   OR cpf LIKE '%046%241%473%67%';