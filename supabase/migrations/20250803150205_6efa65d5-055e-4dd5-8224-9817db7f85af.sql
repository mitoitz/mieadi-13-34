-- Criar usuário diretor@mieadi.com.br no sistema de autenticação do Supabase
-- Isso permitirá que o login funcione adequadamente e estabeleça o contexto correto

-- Primeiro, vamos tentar criar o usuário admin no Supabase Auth
SELECT create_supabase_auth_for_profile('diretor@mieadi.com.br', 'Diretor123!');