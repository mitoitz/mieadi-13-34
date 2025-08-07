-- Criar usuário do diretor no Supabase Auth
-- Como não podemos acessar auth.users diretamente, vamos usar uma função para isso

CREATE OR REPLACE FUNCTION create_director_auth_user()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  director_id UUID := '2105fb66-4072-4676-846d-bfb8dbe8734a';
  director_email TEXT := 'diretor@mieadi.com.br';
  director_password TEXT := 'Diretor123!';
  salt TEXT;
  password_hash TEXT;
BEGIN
  -- Gerar salt e hash da senha
  salt := gen_salt('bf');
  password_hash := crypt(director_password, salt);
  
  -- Tentar inserir o usuário no auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      director_id,
      'authenticated',
      'authenticated',
      director_email,
      password_hash,
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'full_name', 'MAURO ARRUDA DE ARRUDA',
        'role', 'diretor'
      ),
      false,
      '',
      '',
      '',
      ''
    );
    
    -- Criar identity
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      director_id,
      jsonb_build_object(
        'sub', director_id::text,
        'email', director_email
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
    RETURN 'Usuário criado com sucesso: ' || director_email || ' / ' || director_password;
    
  EXCEPTION WHEN others THEN
    -- Se já existe, tentar atualizar a senha
    UPDATE auth.users 
    SET encrypted_password = password_hash,
        updated_at = NOW()
    WHERE id = director_id;
    
    RETURN 'Usuário já existe, senha atualizada: ' || director_email || ' / ' || director_password;
  END;
END;
$$;

-- Executar a função
SELECT create_director_auth_user();