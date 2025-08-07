-- Limpeza completa de todos os acessos do sistema
-- ATENÇÃO: Esta operação irá remover TODOS os usuários e dados de autenticação

-- Primeiro, limpar tabelas que não estão no esquema, mas que podem existir
DELETE FROM security_audit_logs;

-- Limpar todas as tabelas relacionadas à autenticação e usuários em ordem reversa de dependência
DELETE FROM audit_logs;
DELETE FROM admin_logs;
DELETE FROM notifications;
DELETE FROM inter_profile_messages;
DELETE FROM member_requests;
DELETE FROM member_indications;
DELETE FROM approval_workflows;

-- Limpar dados acadêmicos associados aos usuários
DELETE FROM assessment_submissions;
DELETE FROM assessment_questions;
DELETE FROM assessments;
DELETE FROM grades;
DELETE FROM attendances;
DELETE FROM attendance_records;
DELETE FROM attendance_receipts;
DELETE FROM enrollments;
DELETE FROM certificates;

-- Limpar materiais e atividades dos professores
DELETE FROM class_materials;
DELETE FROM materials;

-- Limpar dados financeiros
DELETE FROM auto_billing_executions;
DELETE FROM auto_billing_rules;

-- Limpar agendamentos e sessões
DELETE FROM class_schedules;
DELETE FROM class_sessions;

-- Limpar tabela de backup de usuários auth
DELETE FROM auth_users_backup;

-- Finalmente, limpar perfis (principal tabela de usuários)
DELETE FROM profiles;

-- Mensagem de confirmação
SELECT 'Limpeza completa concluída. Todos os usuários e dados de autenticação foram removidos do banco de dados.' as status;