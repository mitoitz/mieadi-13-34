-- Limpeza apenas dos acessos do sistema, mantendo informações organizacionais
-- ATENÇÃO: Esta operação irá remover APENAS usuários e dados de autenticação

-- Limpar logs de auditoria e administração
DELETE FROM security_audit_logs;
DELETE FROM audit_logs;
DELETE FROM admin_logs;

-- Limpar notificações de usuários específicos
DELETE FROM notifications WHERE user_id IS NOT NULL;

-- Limpar mensagens entre perfis
DELETE FROM inter_profile_messages;

-- Limpar solicitações e indicações de membros
DELETE FROM member_requests;
DELETE FROM member_indications;

-- Limpar workflows de aprovação
DELETE FROM approval_workflows;

-- Limpar dados de presença vinculados a usuários específicos
DELETE FROM attendances WHERE student_id IS NOT NULL;
DELETE FROM attendance_records WHERE student_id IS NOT NULL;
DELETE FROM attendance_receipts WHERE student_id IS NOT NULL;

-- Limpar matrículas (vinculam usuários a turmas)
DELETE FROM enrollments;

-- Limpar notas de alunos
DELETE FROM grades WHERE student_id IS NOT NULL;

-- Limpar submissões de avaliações
DELETE FROM assessment_submissions WHERE student_id IS NOT NULL;

-- Limpar certificados de alunos específicos
DELETE FROM certificates WHERE student_id IS NOT NULL;

-- Limpar materiais vinculados a professores específicos
UPDATE materials SET professor_id = NULL WHERE professor_id IS NOT NULL;
UPDATE class_materials SET teacher_id = NULL, uploaded_by = NULL WHERE teacher_id IS NOT NULL OR uploaded_by IS NOT NULL;

-- Limpar referencias de usuários em classes
UPDATE classes SET professor_id = NULL WHERE professor_id IS NOT NULL;

-- Limpar referencias de usuários em eventos  
UPDATE events SET created_by = NULL WHERE created_by IS NOT NULL;

-- Limpar referencias de responsáveis em campos
UPDATE fields SET responsible_id = NULL WHERE responsible_id IS NOT NULL;

-- Limpar tabela de backup de usuários auth
DELETE FROM auth_users_backup;

-- Finalmente, limpar perfis (principal tabela de usuários)
DELETE FROM profiles;

-- Confirmar limpeza
SELECT 'Dados de acesso removidos. Informações organizacionais mantidas.' as status;