-- Permitir acesso público temporário para a tabela member_requests durante demonstração
-- Desabilitar RLS temporariamente na tabela member_requests para permitir acesso durante demonstração
ALTER TABLE member_requests DISABLE ROW LEVEL SECURITY;