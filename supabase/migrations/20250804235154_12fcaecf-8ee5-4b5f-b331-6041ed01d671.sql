-- Primeiro, vamos desabilitar temporariamente o trigger que está causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verificar se o usuário diretor existe no auth.users
DO $$
DECLARE
    director_profile RECORD;
    director_password TEXT := 'Diretor123!';
BEGIN
    -- Buscar perfil do diretor
    SELECT * INTO director_profile 
    FROM profiles 
    WHERE email = 'diretor@mieadi.com.br' AND role = 'diretor';
    
    IF FOUND THEN
        -- Primeiro, deletar qualquer registro existente no auth.users com este email
        DELETE FROM auth.users WHERE email = 'diretor@mieadi.com.br';
        
        -- Criar novo usuário de autenticação
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
            raw_app_meta_data
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            director_profile.id,
            'authenticated',
            'authenticated',
            director_profile.email,
            crypt(director_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'full_name', director_profile.full_name,
                'role', director_profile.role
            ),
            jsonb_build_object(
                'provider', 'email',
                'providers', jsonb_build_array('email')
            )
        );
        
        -- Criar identity record
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
            director_profile.id,
            jsonb_build_object(
                'sub', director_profile.id::text,
                'email', director_profile.email
            ),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuário de autenticação criado para: %', director_profile.email;
    ELSE
        RAISE NOTICE 'Perfil do diretor não encontrado';
    END IF;
END $$;

-- Recriar o trigger com proteção contra duplicatas
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o perfil já existe antes de tentar criar
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_registration();