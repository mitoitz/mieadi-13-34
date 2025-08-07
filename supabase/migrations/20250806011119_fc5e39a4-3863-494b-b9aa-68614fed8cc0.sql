-- Adicionar apenas os campos necessários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tela_permitida TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT true;

-- Remover funções existentes se houver
DROP FUNCTION IF EXISTS verify_user_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS set_user_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS authenticate_by_cpf(TEXT);

-- Função para autenticar por CPF
CREATE OR REPLACE FUNCTION authenticate_by_cpf(cpf_input TEXT)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para configurar PIN
CREATE OR REPLACE FUNCTION set_user_pin(user_id UUID, new_pin TEXT)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar PIN
CREATE OR REPLACE FUNCTION verify_user_pin(user_id UUID, pin_input TEXT)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;