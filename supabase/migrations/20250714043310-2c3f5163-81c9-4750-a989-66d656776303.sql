-- Verificar e configurar usuário admin
-- Como o usuário já existe no profiles, vamos garantir que ele tenha acesso ao auth

-- Primeiro, vamos verificar se precisamos atualizar alguma coisa no perfil
UPDATE profiles 
SET 
  email = 'master@sistema.com',
  role = 'admin',
  status = 'ativo',
  full_name = 'Usuário Master'
WHERE cpf = '048.169.543-50';

-- Inserir ou atualizar permissões do admin
INSERT INTO role_permissions (role, permissions)
VALUES ('admin', '{
  "users": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "congregations": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "courses": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "subjects": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "reports": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "system": {
    "admin": true,
    "settings": true,
    "audit_logs": true
  }
}'::jsonb)
ON CONFLICT (role) 
DO UPDATE SET permissions = EXCLUDED.permissions;