-- Atualizar perfil com CPF 048.169.543-50 para role admin
UPDATE public.profiles 
SET role = 'admin', 
    status = 'ativo',
    updated_at = now()
WHERE cpf = '048.169.543-50';

-- Se não existir, criar o perfil
INSERT INTO public.profiles (
    full_name, 
    cpf, 
    role, 
    status, 
    email,
    created_at, 
    updated_at
)
SELECT 
    'Usuário Master',
    '048.169.543-50',
    'admin',
    'ativo',
    'master@sistema.com',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE cpf = '048.169.543-50'
);