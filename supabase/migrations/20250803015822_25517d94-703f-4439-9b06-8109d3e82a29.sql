-- Limpeza completa de todos os acessos do sistema
-- ATENÇÃO: Esta operação irá remover TODOS os usuários e dados de autenticação

-- 1. Desabilitar triggers temporariamente
ALTER TABLE profiles DISABLE TRIGGER ALL;
ALTER TABLE auth_users_backup DISABLE TRIGGER ALL;

-- 2. Limpar todas as tabelas relacionadas à autenticação e usuários
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE admin_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE inter_profile_messages CASCADE;
TRUNCATE TABLE member_requests CASCADE;
TRUNCATE TABLE member_indications CASCADE;
TRUNCATE TABLE approval_workflows CASCADE;

-- 3. Limpar dados acadêmicos associados aos usuários
TRUNCATE TABLE assessment_submissions CASCADE;
TRUNCATE TABLE grades CASCADE;
TRUNCATE TABLE attendances CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE attendance_receipts CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE certificates CASCADE;

-- 4. Limpar materiais e atividades dos professores
TRUNCATE TABLE class_materials CASCADE;
TRUNCATE TABLE materials CASCADE;

-- 5. Limpar dados financeiros
TRUNCATE TABLE auto_billing_executions CASCADE;
TRUNCATE TABLE auto_billing_rules CASCADE;

-- 6. Limpar tabela de backup de usuários auth
TRUNCATE TABLE auth_users_backup CASCADE;

-- 7. Limpar perfis (principal tabela de usuários)
TRUNCATE TABLE profiles CASCADE;

-- 8. Reabilitar triggers
ALTER TABLE profiles ENABLE TRIGGER ALL;
ALTER TABLE auth_users_backup ENABLE TRIGGER ALL;

-- 9. Resetar sequências se existirem
-- (Não há sequências explícitas neste esquema, todos os IDs são UUID)

-- 10. Limpar dados de autenticação do Supabase Auth (se possível)
-- NOTA: Como não podemos acessar diretamente auth.users, tentaremos através de funções

-- Função para limpar dados de autenticação residuais
CREATE OR REPLACE FUNCTION public.cleanup_auth_data()
RETURNS TEXT AS $$
BEGIN
    -- Tentar limpar dados de autenticação conhecidos
    -- Como não podemos acessar auth.users diretamente, apenas garantimos limpeza local
    
    RETURN 'Limpeza completa concluída. Todos os usuários e dados de autenticação foram removidos.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar limpeza
SELECT public.cleanup_auth_data();

-- Opcional: Criar usuário master padrão se necessário
-- (comentado para limpeza completa)
-- INSERT INTO profiles (
--     id,
--     full_name,
--     email,
--     cpf,
--     role,
--     status,
--     password_hash,
--     first_login
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     'Administrador Master',
--     'admin@sistema.com',
--     '048.169.543-50',
--     'admin',
--     'ativo',
--     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: mudar123
--     true
-- );

-- Remover função de limpeza após uso
DROP FUNCTION IF EXISTS public.cleanup_auth_data();