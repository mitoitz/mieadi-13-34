-- Inserir dados iniciais se não existirem

-- 1. Inserir congregações básicas
INSERT INTO congregations (name, address, city, state, postal_code, phone, email, pastor_name)
SELECT * FROM (VALUES 
  ('Igreja Central', 'Rua Principal, 123', 'São Paulo', 'SP', '01000-000', '(11) 99999-9999', 'central@mieadi.com.br', 'Pastor Principal'),
  ('Igreja Vila Nova', 'Av. Nova, 456', 'São Paulo', 'SP', '02000-000', '(11) 88888-8888', 'vilanova@mieadi.com.br', 'Pastor Auxiliar')
) AS v(name, address, city, state, postal_code, phone, email, pastor_name)
WHERE NOT EXISTS (SELECT 1 FROM congregations);

-- 2. Inserir campos ministeriais básicos
INSERT INTO fields (name, description)
SELECT * FROM (VALUES 
  ('Ministério de Ensino', 'Responsável pela educação teológica e acadêmica'),
  ('Ministério de Evangelismo', 'Responsável pela evangelização e missões'),
  ('Ministério de Louvor', 'Responsável pela música e adoração'),
  ('Ministério de Assistência Social', 'Responsável pela ação social e comunitária')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM fields);

-- 3. Inserir cursos básicos
INSERT INTO courses (name, description, duration_months, total_credits)
SELECT * FROM (VALUES 
  ('Teologia Básica', 'Curso introdutório de teologia para novos membros', 12, 60),
  ('Teologia Intermediária', 'Curso intermediário de teologia', 18, 90),
  ('Bacharel em Teologia', 'Curso superior de teologia', 36, 180),
  ('Ministério Pastoral', 'Formação específica para pastores', 24, 120)
) AS v(name, description, duration_months, total_credits)
WHERE NOT EXISTS (SELECT 1 FROM courses);

-- 4. Inserir disciplinas básicas
INSERT INTO subjects (name, description, credits, workload_hours)
SELECT * FROM (VALUES 
  ('Bíblia Sagrada I', 'Introdução ao estudo das Sagradas Escrituras', 4, 60),
  ('Bíblia Sagrada II', 'Aprofundamento no estudo bíblico', 4, 60),
  ('Teologia Sistemática I', 'Fundamentos da teologia sistemática', 6, 90),
  ('História da Igreja', 'História do cristianismo através dos séculos', 4, 60),
  ('Homilética', 'Arte da pregação e comunicação cristã', 4, 60),
  ('Grego Bíblico', 'Estudo do grego do Novo Testamento', 6, 90),
  ('Hebraico Bíblico', 'Estudo do hebraico do Antigo Testamento', 6, 90),
  ('Ética Cristã', 'Princípios éticos na perspectiva cristã', 4, 60)
) AS v(name, description, credits, workload_hours)
WHERE NOT EXISTS (SELECT 1 FROM subjects);

-- 5. Inserir usuário admin teste se não existir
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE cpf = '00000000001') INTO admin_exists;
    
    IF NOT admin_exists THEN
        INSERT INTO profiles (
            id, 
            full_name, 
            email, 
            cpf, 
            role, 
            status, 
            password_hash, 
            first_login, 
            terms_accepted, 
            privacy_policy_accepted
        ) VALUES (
            '00000000-0000-0000-0000-000000000002',
            'Administrador Sistema',
            'admin@mieadi.com.br',
            '00000000001',
            'admin',
            'ativo',
            '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.',
            false,
            true,
            true
        );
    END IF;
END $$;