-- Verificar e corrigir o problema de múltiplos perfis com mesmo email

-- 1. Deletar o perfil duplicado (membro) que está causando conflito
DELETE FROM profiles 
WHERE email = 'mauro.admin@mieadi.com' 
AND role = 'membro' 
AND full_name = 'Usuário'
AND id = '58993e12-3aa1-41bf-b2a3-454b0c485a6a';

-- 2. Garantir que o perfil correto (diretor) seja o único
-- O perfil correto já existe: 2105fb66-4072-4676-846d-bfb8dbe8734a com role diretor