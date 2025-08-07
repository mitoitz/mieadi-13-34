-- Verificar pessoas sem role definido e atualizar para 'membro'
UPDATE profiles 
SET role = 'membro'::user_role 
WHERE role IS NULL;

-- Verificar o resultado
SELECT COUNT(*) as pessoas_atualizadas 
FROM profiles 
WHERE role = 'membro'::user_role;