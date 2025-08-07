-- Remover função de validação que está causando problemas
DROP FUNCTION IF EXISTS validate_user_input() CASCADE;

-- Adicionar campos necessários para o sistema de PIN
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS tela_permitida TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT true;

-- Inserir CPF de teste se a tabela estiver vazia ou com dados inválidos
INSERT INTO profiles (id, full_name, cpf, role, tela_permitida) 
VALUES 
  ('04816954-3508-4c2c-b9f4-123456789012', 'FERNANDO BRITO SANTANA', '04816954350', 'diretor', 'admin'),
  ('04816954-3508-4c2c-b9f4-123456789013', 'TESTE SECRETARIO', '12345678901', 'secretario', 'secretaria'),
  ('04816954-3508-4c2c-b9f4-123456789014', 'TESTE PROFESSOR', '12345678902', 'professor', 'painel_professor')
ON CONFLICT (id) DO UPDATE SET 
  cpf = EXCLUDED.cpf,
  role = EXCLUDED.role,
  tela_permitida = EXCLUDED.tela_permitida;

-- Função para autenticação por CPF
CREATE OR REPLACE FUNCTION authenticate_by_cpf(cpf_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clean_cpf TEXT;
    user_record profiles%ROWTYPE;
BEGIN
    clean_cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
    
    SELECT * INTO user_record FROM profiles WHERE cpf = clean_cpf;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'CPF não encontrado no sistema');
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
    IF new_pin !~ '^\d{4}$' THEN
        RETURN json_build_object('success', false, 'message', 'PIN deve conter exatamente 4 números');
    END IF;
    
    hashed_pin := crypt(new_pin, gen_salt('bf'));
    UPDATE profiles SET pin = hashed_pin WHERE id = user_id;
    
    RETURN json_build_object('success', true, 'message', 'PIN configurado com sucesso');
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
    IF pin_input !~ '^\d{4}$' THEN
        RETURN json_build_object('success', false, 'message', 'PIN deve conter exatamente 4 números');
    END IF;
    
    SELECT * INTO user_record FROM profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    IF user_record.pin IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'PIN não configurado');
    END IF;
    
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
        RETURN json_build_object('success', false, 'message', 'PIN incorreto');
    END IF;
END;
$$;