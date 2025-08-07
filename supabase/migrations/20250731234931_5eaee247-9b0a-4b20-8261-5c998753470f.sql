-- Verificar se a tabela profiles existe e criar se necessário
DO $$
BEGIN
    -- Verificar se a tabela profiles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Criar a tabela profiles se não existir
        CREATE TABLE public.profiles (
            id uuid NOT NULL PRIMARY KEY,
            full_name text NOT NULL,
            cpf text UNIQUE,
            email text,
            phone text,
            role user_role DEFAULT 'membro'::user_role,
            congregation_id uuid,
            course_id uuid,
            field_id uuid,
            photo_url text,
            address text,
            birth_date date,
            admission_date date,
            gender text,
            civil_status text,
            profession text,
            education_level text,
            father_name text,
            mother_name text,
            mother_name text,
            spouse_name text,
            ministerial_position text,
            emergency_contact_name text,
            emergency_contact_phone text,
            badge_number text,
            qr_code text UNIQUE,
            password_hash text,
            first_login boolean DEFAULT true,
            last_login timestamp with time zone,
            last_password_change timestamp with time zone,
            terms_accepted boolean DEFAULT false,
            terms_accepted_at timestamp with time zone,
            privacy_policy_accepted boolean DEFAULT false,
            privacy_policy_accepted_at timestamp with time zone,
            two_factor_enabled boolean DEFAULT false,
            two_factor_pin text,
            pin_attempts integer DEFAULT 0,
            pin_locked_until timestamp with time zone,
            status text DEFAULT 'ativo',
            is_absent boolean DEFAULT false,
            absence_start_date date,
            absence_end_date date,
            absence_reason text,
            member_since date,
            bio text,
            gamification_data jsonb DEFAULT '{"level": 1, "badges": [], "points": 0, "achievements": []}'::jsonb,
            permissions jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Habilitar RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- Criar políticas RLS básicas
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (id = auth.uid());

        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (id = auth.uid());

        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );

        CREATE POLICY "Admins can manage all profiles" ON public.profiles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );

        -- Trigger para auto-gerar QR code
        CREATE TRIGGER auto_generate_qr_code_trigger
            BEFORE INSERT ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION auto_generate_qr_code();

        -- Trigger para auto-gerar badge number
        CREATE TRIGGER auto_generate_badge_number_trigger
            BEFORE INSERT ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION auto_generate_badge_number();

        -- Trigger para definir senha padrão
        CREATE TRIGGER set_default_password_trigger
            BEFORE INSERT ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION set_default_password();

        -- Trigger para atualizar updated_at
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela profiles criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe.';
    END IF;

    -- Verificar se existe pelo menos um usuário admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        -- Inserir usuário admin padrão
        INSERT INTO public.profiles (
            id,
            full_name,
            cpf,
            email,
            role,
            password_hash,
            first_login,
            terms_accepted,
            privacy_policy_accepted,
            status
        ) VALUES (
            gen_random_uuid(),
            'Administrador do Sistema',
            '00000000000',
            'admin@mieadi.com',
            'admin',
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: mudar123
            true,
            true,
            true,
            'ativo'
        );

        RAISE NOTICE 'Usuário administrador criado com sucesso!';
        RAISE NOTICE 'CPF: 00000000000, Senha: mudar123';
    END IF;
END $$;