-- Limpeza completa de todos os acessos do sistema
-- ATENÇÃO: Esta operação irá remover TODOS os usuários e dados de autenticação

-- Limpar tabelas que referenciam profiles diretamente
DELETE FROM security_audit_logs;
DELETE FROM audit_logs;
DELETE FROM admin_logs;
DELETE FROM notifications;
DELETE FROM inter_profile_messages;
DELETE FROM member_requests;
DELETE FROM member_indications;
DELETE FROM approval_workflows;

-- Limpar classes e suas dependências primeiro
DELETE FROM class_schedules;
DELETE FROM class_sessions;
DELETE FROM class_subjects;
DELETE FROM assessments;
DELETE FROM assessment_questions;
DELETE FROM assessment_submissions;
DELETE FROM grades;
DELETE FROM attendances;
DELETE FROM attendance_records;
DELETE FROM attendance_receipts;
DELETE FROM enrollments;
DELETE FROM certificates;
DELETE FROM class_materials;
DELETE FROM materials;
DELETE FROM classes; -- Remover classes que podem referenciar professor_id

-- Limpar dados financeiros
DELETE FROM auto_billing_executions;
DELETE FROM auto_billing_rules;

-- Limpar eventos que podem referenciar created_by
DELETE FROM events;

-- Limpar campos e congregações que podem referenciar responsible_id/pastor
DELETE FROM fields;
DELETE FROM congregations;

-- Limpar tabela de backup de usuários auth
DELETE FROM auth_users_backup;

-- Finalmente, limpar perfis (principal tabela de usuários)
DELETE FROM profiles;

-- Confirmar limpeza
SELECT 'Todos os dados de usuários e autenticação foram removidos do banco de dados.' as status;