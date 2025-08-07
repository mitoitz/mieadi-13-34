-- Limpeza completa de todos os acessos do sistema
-- ATENÇÃO: Esta operação irá remover TODOS os usuários e dados de autenticação

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

-- Limpar tabela de backup de usuários auth
DELETE FROM auth_users_backup;

-- Limpar perfis (principal tabela de usuários)
DELETE FROM profiles;

-- Limpar dados locais/sessões (para ser feito no frontend)
-- localStorage será limpo via código JavaScript