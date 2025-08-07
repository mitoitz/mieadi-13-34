-- Função para criar usuários administrativos no Supabase Auth
CREATE OR REPLACE FUNCTION create_admin_auth_users()
RETURNS TABLE(email text, password text, result text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
    temp_password TEXT := 'Admin123!';
BEGIN
    -- Iterar pelos perfis administrativos que precisam de acesso por email
    FOR admin_record IN 
        SELECT p.id, p.full_name, p.email, p.cpf, p.role 
        FROM profiles p
        WHERE p.role IN ('admin', 'coordenador', 'professor', 'secretario') 
        AND p.email IS NOT NULL 
        AND p.email != ''
        AND p.email NOT LIKE '%@example.com'
        ORDER BY p.email
    LOOP
        -- Tentar inserir usuário na tabela auth.users
        BEGIN
            INSERT INTO auth.users (
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_user_meta_data,
                aud,
                role
            ) VALUES (
                admin_record.id,
                admin_record.email,
                crypt(temp_password, gen_salt('bf')), -- Hash da senha
                now(),
                now(),
                now(),
                jsonb_build_object(
                    'full_name', admin_record.full_name,
                    'cpf', admin_record.cpf,
                    'role', admin_record.role
                ),
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (email) DO UPDATE SET
                encrypted_password = crypt(temp_password, gen_salt('bf')),
                updated_at = now();
            
            -- Retornar resultado de sucesso
            RETURN QUERY SELECT admin_record.email, temp_password, 'CRIADO/ATUALIZADO' as result;
            
        EXCEPTION WHEN OTHERS THEN
            -- Retornar resultado de erro
            RETURN QUERY SELECT admin_record.email, temp_password, 'ERRO: ' || SQLERRM as result;
        END;
    END LOOP;
    
    -- Criar usuários padrão se não existirem
    BEGIN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            aud,
            role
        ) VALUES 
        (
            gen_random_uuid(),
            'admin@mieadi.com',
            crypt('Admin123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Administrador Master', 'role', 'admin'),
            'authenticated',
            'authenticated'
        ),
        (
            gen_random_uuid(),
            'coordenador@mieadi.com',
            crypt('Coord123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Coordenador', 'role', 'coordenador'),
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (email) DO UPDATE SET
            encrypted_password = EXCLUDED.encrypted_password,
            updated_at = now();
        
        RETURN QUERY SELECT 'admin@mieadi.com'::text, 'Admin123!'::text, 'USUÁRIO PADRÃO CRIADO' as result;
        RETURN QUERY SELECT 'coordenador@mieadi.com'::text, 'Coord123!'::text, 'USUÁRIO PADRÃO CRIADO' as result;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'PADRÃO'::text, ''::text, 'ERRO AO CRIAR USUÁRIOS PADRÃO: ' || SQLERRM as result;
    END;
    
    RETURN;
END;
$$;