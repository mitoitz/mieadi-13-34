-- Criar função generate_qr_code se não existir
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    new_code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_code := 'QR_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
        
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE qr_code = new_code
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

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
    privacy_policy_accepted,
    qr_code
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
        true,
        'QR_PROF001'
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
        true,
        'QR_PROF002'
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
        true,
        'QR_PROF003'
    )
) AS v(id, full_name, email, cpf, role, status, password_hash, first_login, terms_accepted, privacy_policy_accepted, qr_code)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.cpf = v.cpf
);