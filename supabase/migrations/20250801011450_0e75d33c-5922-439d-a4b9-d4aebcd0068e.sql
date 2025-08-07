-- ========================================
-- CORREÇÃO COMPLETA DE SEGURANÇA E PERMISSÕES
-- ========================================

-- 1. CORRIGIR SEARCH_PATH EM TODAS AS FUNÇÕES (Security Fix)
-- ========================================

-- Corrigir função generate_qr_code
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
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

-- Corrigir função generate_badge_number
CREATE OR REPLACE FUNCTION public.generate_badge_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    next_number integer;
    new_badge_number text;
BEGIN
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(p.badge_number, '[^0-9]', '', 'g') AS integer)), 0) + 1
    INTO next_number
    FROM profiles p
    WHERE p.badge_number IS NOT NULL 
    AND p.badge_number ~ '^[0-9]+$';
    
    IF next_number <= 1000 THEN
        next_number := 1001;
    END IF;
    
    new_badge_number := LPAD(next_number::text, 6, '0');
    
    RETURN new_badge_number;
END;
$$;

-- Corrigir função generate_receipt_number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
        
        SELECT EXISTS(
            SELECT 1 FROM attendance_receipts 
            WHERE receipt_number = new_number
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$;

-- Corrigir função generate_certificate_number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    new_number text;
    exists_check boolean;
BEGIN
    LOOP
        new_number := 'CERT-' || EXTRACT(year FROM NOW()) || '-' || 
                      LPAD((RANDOM() * 999999)::integer::text, 6, '0');
        
        SELECT EXISTS(
            SELECT 1 FROM certificates 
            WHERE certificate_number = new_number
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$;

-- Corrigir função generate_validation_code
CREATE OR REPLACE FUNCTION public.generate_validation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    new_code text;
    exists_check boolean;
BEGIN
    LOOP
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
        
        SELECT EXISTS(
            SELECT 1 FROM certificates 
            WHERE validation_code = new_code
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- 2. CRIAR ENUM PARA ROLES SE NÃO EXISTIR
-- ========================================

-- Verificar se o enum user_role já existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'coordenador', 
            'secretario',
            'professor',
            'aluno',
            'pastor',
            'membro'
        );
    END IF;
END$$;

-- Verificar se o enum user_status já existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM (
            'ativo',
            'inativo',
            'suspenso',
            'pendente'
        );
    END IF;
END$$;

-- 3. ATUALIZAR TABELA PROFILES COM CONSTRAINTS NECESSÁRIOS
-- ========================================

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'membro',
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS congregation_id uuid,
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_pin varchar(4),
ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamp with time zone;

-- Garantir que role não seja null
UPDATE public.profiles SET role = 'membro' WHERE role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Garantir que status não seja null
UPDATE public.profiles SET status = 'ativo' WHERE status IS NULL;
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;

-- 4. CRIAR SISTEMA DE PERMISSÕES BASEADO EM ROLES
-- ========================================

-- Função para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.has_role_permission(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role::text = required_role 
        AND status = 'ativo'
    );
$$;

-- Função para verificar se é admin/coordenador
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = COALESCE(user_id, auth.uid())
        AND role IN ('admin', 'coordenador') 
        AND status = 'ativo'
    );
$$;

-- Função para verificar se é professor
CREATE OR REPLACE FUNCTION public.is_teacher(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = COALESCE(user_id, auth.uid())
        AND role = 'professor' 
        AND status = 'ativo'
    );
$$;

-- 5. ATUALIZAR POLÍTICAS RLS PARA PROFILES
-- ========================================

-- Dropar políticas existentes para recriar corretamente
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin and coordinators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin and coordinators can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;

-- Política para visualização de perfis
CREATE POLICY "Users can view accessible profiles" ON public.profiles
FOR SELECT
USING (
    -- Usuário pode ver seu próprio perfil
    id = auth.uid() 
    OR 
    -- Admin/coordenador pode ver todos os perfis
    is_admin_or_coordinator()
    OR
    -- Professor pode ver perfis de seus alunos
    (is_teacher() AND id IN (
        SELECT e.student_id 
        FROM enrollments e 
        JOIN classes c ON e.class_id = c.id 
        WHERE c.professor_id = auth.uid()
    ))
    OR
    -- Secretários podem ver perfis básicos
    (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'secretario' 
        AND status = 'ativo'
    ))
);

-- Política para atualização de perfis
CREATE POLICY "Users can update their profiles appropriately" ON public.profiles
FOR UPDATE
USING (
    -- Usuário pode atualizar seu próprio perfil (exceto role)
    id = auth.uid()
    OR 
    -- Admin/coordenador pode atualizar qualquer perfil
    is_admin_or_coordinator()
)
WITH CHECK (
    -- Verificar que role não está sendo alterada por usuário comum
    (id = auth.uid() AND (OLD.role = NEW.role OR is_admin_or_coordinator()))
    OR 
    -- Admin/coordenador pode alterar qualquer coisa
    is_admin_or_coordinator()
);

-- Política para inserção de perfis
CREATE POLICY "Authorized users can create profiles" ON public.profiles
FOR INSERT
WITH CHECK (
    -- System/trigger pode criar perfis
    auth.uid() IS NULL
    OR
    -- Admin/coordenador pode criar perfis
    is_admin_or_coordinator()
    OR
    -- Auto-inserção durante cadastro (id = auth.uid())
    id = auth.uid()
);

-- Política para deleção (muito restritiva)
CREATE POLICY "Only admins can delete profiles" ON public.profiles
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'ativo'
    )
);

-- 6. POLÍTICAS PARA CLASSES
-- ========================================

-- Dropar políticas existentes
DROP POLICY IF EXISTS "Users can view accessible classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their classes" ON public.classes;
DROP POLICY IF EXISTS "Admins and coordinators can manage classes" ON public.classes;

-- Recrear políticas para classes
CREATE POLICY "Users can view classes appropriately" ON public.classes
FOR SELECT
USING (
    -- Admin/coordenador pode ver todas as classes
    is_admin_or_coordinator()
    OR
    -- Professor pode ver suas classes
    professor_id = auth.uid()
    OR
    -- Aluno pode ver classes onde está matriculado
    id IN (
        SELECT class_id FROM enrollments 
        WHERE student_id = auth.uid() AND status = 'ativa'
    )
);

CREATE POLICY "Authorized users can manage classes" ON public.classes
FOR ALL
USING (
    -- Admin/coordenador pode gerenciar todas as classes
    is_admin_or_coordinator()
    OR
    -- Professor pode gerenciar suas próprias classes
    (professor_id = auth.uid() AND is_teacher())
)
WITH CHECK (
    -- Admin/coordenador pode criar/modificar qualquer classe
    is_admin_or_coordinator()
    OR
    -- Professor só pode criar classes para si mesmo
    (professor_id = auth.uid() AND is_teacher())
);

-- 7. POLÍTICAS PARA MATRÍCULAS
-- ========================================

DROP POLICY IF EXISTS "Users can view their enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Users can view relevant enrollments" ON public.enrollments
FOR SELECT
USING (
    -- Aluno pode ver suas próprias matrículas
    student_id = auth.uid()
    OR
    -- Admin/coordenador pode ver todas as matrículas
    is_admin_or_coordinator()
    OR
    -- Professor pode ver matrículas de suas classes
    class_id IN (
        SELECT id FROM classes WHERE professor_id = auth.uid()
    )
);

CREATE POLICY "Authorized users can manage enrollments" ON public.enrollments
FOR ALL
USING (
    -- Admin/coordenador pode gerenciar todas as matrículas
    is_admin_or_coordinator()
)
WITH CHECK (
    -- Admin/coordenador pode criar/modificar matrículas
    is_admin_or_coordinator()
);

-- 8. POLÍTICAS PARA NOTAS
-- ========================================

DROP POLICY IF EXISTS "Students can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers and admins can manage grades" ON public.grades;

CREATE POLICY "Users can view relevant grades" ON public.grades
FOR SELECT
USING (
    -- Aluno pode ver suas próprias notas
    student_id = auth.uid()
    OR
    -- Admin/coordenador pode ver todas as notas
    is_admin_or_coordinator()
    OR
    -- Professor pode ver notas de suas classes
    class_id IN (
        SELECT id FROM classes WHERE professor_id = auth.uid()
    )
);

CREATE POLICY "Authorized users can manage grades" ON public.grades
FOR ALL
USING (
    -- Admin/coordenador pode gerenciar todas as notas
    is_admin_or_coordinator()
    OR
    -- Professor pode gerenciar notas de suas classes
    (is_teacher() AND class_id IN (
        SELECT id FROM classes WHERE professor_id = auth.uid()
    ))
)
WITH CHECK (
    -- Admin/coordenador pode criar/modificar qualquer nota
    is_admin_or_coordinator()
    OR
    -- Professor pode criar/modificar notas de suas classes
    (is_teacher() AND class_id IN (
        SELECT id FROM classes WHERE professor_id = auth.uid()
    ))
);

-- 9. TRIGGER PARA AUTO-GERAÇÃO DE DADOS
-- ========================================

CREATE OR REPLACE FUNCTION public.auto_generate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    -- Gerar QR code se não fornecido
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_code();
    END IF;
    
    -- Gerar badge number se não fornecido
    IF NEW.badge_number IS NULL THEN
        NEW.badge_number := generate_badge_number();
    END IF;
    
    -- Definir role padrão se não fornecido
    IF NEW.role IS NULL THEN
        NEW.role := 'membro';
    END IF;
    
    -- Definir status padrão se não fornecido
    IF NEW.status IS NULL THEN
        NEW.status := 'ativo';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela profiles
DROP TRIGGER IF EXISTS auto_generate_profile_data_trigger ON public.profiles;
CREATE TRIGGER auto_generate_profile_data_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_profile_data();

-- 10. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para melhorar performance das consultas de permissão
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_profiles_congregation_role ON public.profiles(congregation_id, role);
CREATE INDEX IF NOT EXISTS idx_classes_professor ON public.classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON public.enrollments(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_class ON public.grades(student_id, class_id);

-- 11. FUNÇÃO PARA VERIFICAR CONFIGURAÇÃO INICIAL
-- ========================================

CREATE OR REPLACE FUNCTION public.system_needs_setup()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE role = 'admin' 
        AND status = 'ativo'
    );
$$;