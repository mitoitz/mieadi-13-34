-- Adicionar campos obrigatórios se não existem e ajustar estrutura
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS tela_permitida TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT true;

-- Tornar CPF obrigatório e único
UPDATE profiles SET cpf = LPAD((RANDOM() * 99999999999)::bigint::text, 11, '0') WHERE cpf IS NULL OR cpf = '';
ALTER TABLE profiles ALTER COLUMN cpf SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_unique ON profiles(cpf);

-- Função para buscar usuário por CPF
CREATE OR REPLACE FUNCTION authenticate_by_cpf(cpf_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clean_cpf TEXT;
    user_record profiles%ROWTYPE;
BEGIN
    -- Limpar CPF
    clean_cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
    
    -- Buscar usuário
    SELECT * INTO user_record
    FROM profiles
    WHERE cpf = clean_cpf;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF não encontrado no sistema'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'CPF encontrado',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'cpf', user_record.cpf,
            'role', user_record.role,
            'tela_permitida', coalesce(user_record.tela_permitida, 'admin'),
            'has_pin', user_record.pin IS NOT NULL,
            'can_edit', coalesce(user_record.can_edit, true),
            'photo_url', user_record.photo_url
        )
    );
END;
$$;

-- Função para configurar PIN
CREATE OR REPLACE FUNCTION set_user_pin(user_id UUID, new_pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hashed_pin TEXT;
BEGIN
    -- Validar PIN (4 dígitos)
    IF new_pin !~ '^\d{4}$' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN deve conter exatamente 4 números'
        );
    END IF;
    
    -- Gerar hash do PIN
    hashed_pin := crypt(new_pin, gen_salt('bf'));
    
    -- Atualizar PIN
    UPDATE profiles 
    SET pin = hashed_pin
    WHERE id = user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'PIN configurado com sucesso'
    );
END;
$$;

-- Função para verificar PIN
CREATE OR REPLACE FUNCTION verify_user_pin(user_id UUID, pin_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record profiles%ROWTYPE;
BEGIN
    -- Validar PIN (4 dígitos)
    IF pin_input !~ '^\d{4}$' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN deve conter exatamente 4 números'
        );
    END IF;
    
    -- Buscar usuário e PIN
    SELECT * INTO user_record
    FROM profiles 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;
    
    -- Verificar se tem PIN configurado
    IF user_record.pin IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'PIN não configurado'
        );
    END IF;
    
    -- Verificar PIN
    IF crypt(pin_input, user_record.pin) = user_record.pin THEN
        RETURN json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso',
            'user', json_build_object(
                'id', user_record.id,
                'full_name', user_record.full_name,
                'cpf', user_record.cpf,
                'role', user_record.role,
                'tela_permitida', coalesce(user_record.tela_permitida, 'admin'),
                'can_edit', coalesce(user_record.can_edit, true),
                'photo_url', user_record.photo_url
            )
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'PIN incorreto'
        );
    END IF;
END;
$$;

-- Políticas de segurança RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Política para usuários atualizarem apenas seus próprios dados
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- Política para diretores e secretários resetarem PIN
CREATE POLICY "Directors and secretaries can reset pins"
ON profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('diretor', 'secretario')
    )
);

-- Função para gerar UUID para auth_users simulado
CREATE OR REPLACE FUNCTION get_current_authenticated_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retornar UUID fictício para testes sem autenticação real
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$;