-- Remover usuários de teste e manter apenas dados reais
DELETE FROM profiles 
WHERE cpf IN ('11111111111', '22222222222', '33333333333', '44444444444', '55555555555', '04816954350')
AND full_name LIKE '%Teste%';

-- Atualizar o usuário diretor existente para ter um CPF válido para teste
UPDATE profiles 
SET cpf = '04816954350',
    email = COALESCE(email, 'diretor@mieadi.com.br'),
    pin = NULL -- Resetar PIN para configuração inicial
WHERE role = 'diretor' 
AND cpf = '00000000000';

-- Garantir que existe pelo menos um usuário válido para demonstração
INSERT INTO profiles (
    id, 
    cpf, 
    full_name, 
    email, 
    role, 
    status, 
    tela_permitida, 
    can_edit
) VALUES (
    gen_random_uuid(),
    '04816954350',
    'MAURO ARRUDA DE ARRUDA',
    'diretor@mieadi.com.br',
    'diretor',
    'ativo',
    'admin',
    true
) ON CONFLICT (cpf) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    tela_permitida = EXCLUDED.tela_permitida,
    can_edit = EXCLUDED.can_edit;