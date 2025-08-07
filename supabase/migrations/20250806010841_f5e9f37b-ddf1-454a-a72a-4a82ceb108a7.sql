-- Atualizar tabela profiles para o sistema de login por CPF com PIN
-- Adicionar campos necessários se não existirem
DO $$ 
BEGIN
    -- Adicionar campo pin se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin') THEN
        ALTER TABLE profiles ADD COLUMN pin TEXT;
    END IF;
    
    -- Adicionar campo tela_permitida se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tela_permitida') THEN
        ALTER TABLE profiles ADD COLUMN tela_permitida TEXT;
    END IF;
    
    -- Adicionar campo can_edit se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'can_edit') THEN
        ALTER TABLE profiles ADD COLUMN can_edit BOOLEAN DEFAULT true;
    END IF;
    
    -- Garantir que CPF seja único
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'profiles' AND constraint_name = 'profiles_cpf_unique') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);
    END IF;
    
    -- Garantir que CPF seja obrigatório
    ALTER TABLE profiles ALTER COLUMN cpf SET NOT NULL;
END $$;

-- Atualizar valores padrão para tela_permitida baseado no role
UPDATE profiles SET tela_permitida = 
    CASE 
        WHEN role = 'diretor' THEN 'admin'
        WHEN role = 'admin' THEN 'admin'
        WHEN role = 'coordenador' THEN 'admin'
        WHEN role = 'secretario' THEN 'secretaria'
        WHEN role = 'professor' THEN 'painel_professor'
        WHEN role = 'aluno' THEN 'painel_aluno'
        WHEN role = 'membro' THEN 'painel_membro'
        WHEN role = 'pastor' THEN 'painel_pastor'
        ELSE 'painel_aluno'
    END
WHERE tela_permitida IS NULL;

-- Função para validar CPF
CREATE OR REPLACE FUNCTION validate_cpf(cpf_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cpf TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    i INTEGER;
BEGIN
    -- Remove caracteres não numéricos
    cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
    
    -- Verifica se tem 11 dígitos
    IF length(cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se todos os dígitos são iguais
    IF cpf ~ '^(\d)\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calcula primeiro dígito verificador
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (substr(cpf, i, 1)::INTEGER * (11 - i));
    END LOOP;
    
    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;
    
    -- Calcula segundo dígito verificador
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (substr(cpf, i, 1)::INTEGER * (12 - i));
    END LOOP;
    
    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;
    
    -- Verifica se os dígitos estão corretos
    RETURN (substr(cpf, 10, 1)::INTEGER = digit1 AND substr(cpf, 11, 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql;

-- Função para autenticar por CPF
CREATE OR REPLACE FUNCTION authenticate_by_cpf(cpf_input TEXT)
RETURNS JSON AS $$
DECLARE
    clean_cpf TEXT;
    user_record profiles%ROWTYPE;
    result JSON;
BEGIN
    -- Limpar CPF
    clean_cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
    
    -- Validar CPF
    IF NOT validate_cpf(clean_cpf) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'CPF inválido'
        );
    END IF;
    
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
    
    -- Atualizar último login
    UPDATE profiles 
    SET last_login = now()
    WHERE id = user_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'CPF encontrado',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'cpf', user_record.cpf,
            'role', user_record.role,
            'tela_permitida', user_record.tela_permitida,
            'has_pin', user_record.pin IS NOT NULL,
            'can_edit', user_record.can_edit,
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
    result JSON;
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
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;
    
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
    stored_pin TEXT;
    user_record profiles%ROWTYPE;
    result JSON;
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
        -- Atualizar último login
        UPDATE profiles 
        SET last_login = now()
        WHERE id = user_id;
        
        RETURN json_build_object(
            'success', true,
            'message', 'PIN verificado com sucesso',
            'user', json_build_object(
                'id', user_record.id,
                'full_name', user_record.full_name,
                'cpf', user_record.cpf,
                'role', user_record.role,
                'tela_permitida', user_record.tela_permitida,
                'can_edit', user_record.can_edit,
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

-- Função para buscar usuário por CPF ou nome (para redefinição de PIN)
CREATE OR REPLACE FUNCTION search_user_for_pin_reset(search_term TEXT)
RETURNS JSON AS $$
DECLARE
    clean_cpf TEXT;
    user_record profiles%ROWTYPE;
    result JSON;
BEGIN
    -- Se for um CPF (apenas números), limpar
    IF search_term ~ '^\d+$' THEN
        clean_cpf := regexp_replace(search_term, '[^0-9]', '', 'g');
        
        SELECT * INTO user_record
        FROM profiles
        WHERE cpf = clean_cpf;
    ELSE
        -- Buscar por nome
        SELECT * INTO user_record
        FROM profiles
        WHERE full_name ILIKE '%' || search_term || '%'
        LIMIT 1;
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Usuário encontrado',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'cpf', user_record.cpf,
            'role', user_record.role
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas RLS para CPF/PIN system
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Política para visualização - usuários só veem seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Política para diretores e secretários verem outros perfis (para redefinição de PIN)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role IN ('diretor', 'secretario')
        )
    );

-- Política para atualização - usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para diretores e secretários atualizarem PINs de outros usuários
CREATE POLICY "Admins can reset pins" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role IN ('diretor', 'secretario')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role IN ('diretor', 'secretario')
        )
    );

-- Função para definir contexto de autenticação sem usar auth.users
CREATE OR REPLACE FUNCTION set_authenticated_context(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Simular contexto de autenticação
    PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter usuário atual do contexto
CREATE OR REPLACE FUNCTION get_current_authenticated_user()
RETURNS UUID AS $$
BEGIN
    RETURN coalesce(auth.uid(), current_setting('app.current_user_id', true)::uuid);
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;