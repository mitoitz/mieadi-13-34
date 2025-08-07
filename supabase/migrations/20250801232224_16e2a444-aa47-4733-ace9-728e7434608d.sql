-- Atualizar emails e senhas padronizadas para administradores
UPDATE profiles 
SET 
  email = CASE 
    WHEN cpf = '04816954350' THEN 'mauro.admin@mieadi.com'
    WHEN cpf = '04624147367' AND full_name = 'FERNANDO BRITO SANTANA' THEN 'fernando.admin@mieadi.com'
    WHEN cpf = '12345678901' THEN 'joao.admin@mieadi.com'
    WHEN cpf = '11144477735' THEN 'master@mieadi.com'
    ELSE email
  END,
  password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.', -- Senha: mudar123
  first_login = true,
  updated_at = now()
WHERE role = 'admin' AND cpf IN ('04816954350', '04624147367', '12345678901', '11144477735');

-- Remover administradores duplicados/inválidos
DELETE FROM profiles 
WHERE role = 'admin' 
AND (
  (cpf = '000.000.000-00') OR 
  (full_name IS NULL) OR
  (id = '8e6584ee-7324-41c4-b47e-0e3f536d97b4') OR
  (id = '4b794b65-64e4-497c-bf9d-bc63950373e6')
);