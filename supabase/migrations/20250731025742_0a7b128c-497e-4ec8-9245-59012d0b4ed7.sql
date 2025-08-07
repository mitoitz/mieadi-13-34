-- Inserir dados iniciais para professores se não existirem
INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    cpf, 
    role, 
    status, 
    password_hash, 
    first_login,
    terms_accepted,
    privacy_policy_accepted
)
SELECT * FROM (VALUES
    (
        '00000000-0000-0000-0000-000000000003'::uuid,
        'Prof. João Silva',
        'joao.silva@mieadi.com.br',
        '11111111111',
        'professor'::user_role,
        'ativo'::user_status,
        '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
        false,
        true,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000004'::uuid,
        'Prof. Maria Santos',
        'maria.santos@mieadi.com.br',
        '22222222222',
        'professor'::user_role,
        'ativo'::user_status,
        '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
        false,
        true,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000005'::uuid,
        'Prof. Pedro Oliveira',
        'pedro.oliveira@mieadi.com.br',
        '33333333333',
        'professor'::user_role,
        'ativo'::user_status,
        '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
        false,
        true,
        true
    )
) AS v(id, full_name, email, cpf, role, status, password_hash, first_login, terms_accepted, privacy_policy_accepted)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.cpf = v.cpf
);