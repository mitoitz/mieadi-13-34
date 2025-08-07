-- Habilitar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar a tabela auth_users_backup com hash correto
DROP TABLE IF EXISTS auth_users_backup;

CREATE TABLE auth_users_backup (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES profiles(id),
    email text UNIQUE NOT NULL,
    encrypted_password text NOT NULL,
    email_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE auth_users_backup ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Only admins can access auth backup" ON auth_users_backup
    FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- Inserir administradores com senhas hash corretas
INSERT INTO auth_users_backup (profile_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
SELECT 
    p.id,
    p.email,
    crypt('mudar123', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'full_name', p.full_name,
        'cpf', p.cpf,
        'role', p.role
    )
FROM profiles p 
WHERE p.role = 'admin' AND p.email IS NOT NULL;