-- QUERIES DE IMPORTAÇÃO PARA O SISTEMA MIEADI
-- Execute na ordem: Congregações -> Campos -> Membros -> Frequência

-- ====================================
-- 1. IMPORTAÇÃO DE CONGREGAÇÕES
-- ====================================
INSERT INTO public.congregations (id, name, address, city, state, postal_code, phone, email, pastor_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Igreja Central', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', '(11) 1234-5678', 'central@igreja.com', 'Pastor João Silva'),
('550e8400-e29b-41d4-a716-446655440002', 'Igreja do Bairro Alto', 'Av. Principal, 456', 'São Paulo', 'SP', '01234-890', '(11) 8765-4321', 'alto@igreja.com', 'Pastor Maria Santos'),
('550e8400-e29b-41d4-a716-446655440003', 'Igreja da Vila', 'Rua da Paz, 789', 'Guarulhos', 'SP', '07123-456', '(11) 5555-1234', 'vila@igreja.com', 'Pastor Carlos Oliveira');

-- ====================================
-- 2. IMPORTAÇÃO DE CAMPOS
-- ====================================
INSERT INTO public.fields (id, name, description, responsible_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Campo São Paulo', 'Campo missionário da região metropolitana de São Paulo', NULL),
('660e8400-e29b-41d4-a716-446655440002', 'Campo Interior', 'Campo missionário do interior do estado', NULL),
('660e8400-e29b-41d4-a716-446655440003', 'Campo Litoral', 'Campo missionário da região litorânea', NULL);

-- ====================================
-- 3. IMPORTAÇÃO DE CURSOS
-- ====================================
INSERT INTO public.courses (id, name, description, duration_months, total_credits) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Teologia Básica', 'Curso básico de teologia para novos membros', 12, 60),
('770e8400-e29b-41d4-a716-446655440002', 'Liderança Cristã', 'Curso de formação de líderes', 18, 90),
('770e8400-e29b-41d4-a716-446655440003', 'Ministério Pastoral', 'Curso de preparação para o ministério pastoral', 24, 120);

-- ====================================
-- 4. IMPORTAÇÃO DE DISCIPLINAS
-- ====================================
INSERT INTO public.subjects (id, name, description, code, credits, course_id) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Introdução à Teologia', 'Fundamentos básicos da teologia cristã', 'TEO101', 4, '770e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'História da Igreja', 'Estudo da história do cristianismo', 'HIS101', 3, '770e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'Liderança Pastoral', 'Princípios de liderança cristã', 'LID101', 4, '770e8400-e29b-41d4-a716-446655440002');

-- ====================================
-- 5. IMPORTAÇÃO DE MEMBROS/PROFILES
-- ====================================
-- NOTA: Substitua os UUIDs pelos IDs reais dos usuários do auth.users
INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    cpf, 
    phone, 
    birth_date, 
    address, 
    role, 
    status, 
    congregation_id, 
    field_id, 
    course_id,
    gender,
    civil_status,
    ministerial_position,
    member_since
) VALUES
-- Pastores/Líderes
('11111111-1111-1111-1111-111111111111', 'Pastor João Silva', 'joao.silva@email.com', '123.456.789-01', '(11) 99999-1111', '1970-01-15', 'Rua A, 100', 'pastor', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NULL, 'M', 'casado', 'Pastor Presidente', '1995-01-01'),
('22222222-2222-2222-2222-222222222222', 'Pastor Maria Santos', 'maria.santos@email.com', '234.567.890-12', '(11) 99999-2222', '1975-03-20', 'Rua B, 200', 'pastor', 'ativo', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', NULL, 'F', 'casada', 'Pastora', '1998-06-15'),

-- Professores
('33333333-3333-3333-3333-333333333333', 'Prof. Carlos Oliveira', 'carlos.oliveira@email.com', '345.678.901-23', '(11) 99999-3333', '1980-05-10', 'Rua C, 300', 'professor', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'M', 'solteiro', 'Professor', '2000-01-10'),
('44444444-4444-4444-4444-444444444444', 'Profa. Ana Costa', 'ana.costa@email.com', '456.789.012-34', '(11) 99999-4444', '1982-07-25', 'Rua D, 400', 'professor', 'ativo', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'F', 'casada', 'Professora', '2001-03-20'),

-- Coordenadores
('55555555-5555-5555-5555-555555555555', 'Coord. Paulo Mendes', 'paulo.mendes@email.com', '567.890.123-45', '(11) 99999-5555', '1978-09-12', 'Rua E, 500', 'coordenador', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NULL, 'M', 'casado', 'Coordenador Acadêmico', '1999-08-01'),

-- Secretários
('66666666-6666-6666-6666-666666666666', 'Sec. Lucia Ferreira', 'lucia.ferreira@email.com', '678.901.234-56', '(11) 99999-6666', '1985-11-30', 'Rua F, 600', 'secretario', 'ativo', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', NULL, 'F', 'solteira', 'Secretária', '2002-02-15'),

-- Alunos
('77777777-7777-7777-7777-777777777777', 'João Pedro Santos', 'joao.pedro@email.com', '789.012.345-67', '(11) 99999-7777', '1995-02-14', 'Rua G, 700', 'aluno', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'M', 'solteiro', NULL, '2020-01-15'),
('88888888-8888-8888-8888-888888888888', 'Maria Clara Lima', 'maria.clara@email.com', '890.123.456-78', '(11) 99999-8888', '1998-04-22', 'Rua H, 800', 'aluno', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'F', 'solteira', NULL, '2020-01-15'),
('99999999-9999-9999-9999-999999999999', 'Pedro Henrique Costa', 'pedro.henrique@email.com', '901.234.567-89', '(11) 99999-9999', '1992-06-08', 'Rua I, 900', 'aluno', 'ativo', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'M', 'casado', NULL, '2020-02-01'),

-- Membros
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'José da Silva', 'jose.silva@email.com', '012.345.678-90', '(11) 99999-0000', '1965-12-03', 'Rua J, 1000', 'membro', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NULL, 'M', 'casado', 'Diácono', '1985-05-20'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maria José Santos', 'maria.jose@email.com', '123.456.789-01', '(11) 99999-1010', '1970-08-17', 'Rua K, 1100', 'membro', 'ativo', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NULL, 'F', 'casada', 'Diaconisa', '1990-03-10');

-- ====================================
-- 6. IMPORTAÇÃO DE TURMAS/CLASSES
-- ====================================
INSERT INTO public.classes (
    id, 
    name, 
    subject_id, 
    professor_id, 
    congregation_id, 
    start_date, 
    end_date, 
    max_students, 
    status, 
    schedule
) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Teologia Básica - Turma A', '880e8400-e29b-41d4-a716-446655440001', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2024-12-15', 30, 'ativa', 'Terças e Quintas 19:00-21:00'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'História da Igreja - Turma A', '880e8400-e29b-41d4-a716-446655440002', '44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440002', '2024-02-01', '2024-11-30', 25, 'ativa', 'Segundas e Quartas 20:00-22:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Liderança Pastoral - Turma A', '880e8400-e29b-41d4-a716-446655440003', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440001', '2024-03-01', '2024-12-20', 20, 'ativa', 'Sábados 14:00-17:00');

-- ====================================
-- 7. IMPORTAÇÃO DE MATRÍCULAS/ENROLLMENTS
-- ====================================
INSERT INTO public.enrollments (
    id, 
    student_id, 
    class_id, 
    course_id, 
    enrollment_date, 
    status
) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '770e8400-e29b-41d4-a716-446655440001', '2024-01-15', 'ativa'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '770e8400-e29b-41d4-a716-446655440001', '2024-01-15', 'ativa'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '770e8400-e29b-41d4-a716-446655440002', '2024-02-01', 'ativa'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '770e8400-e29b-41d4-a716-446655440001', '2024-02-01', 'ativa');

-- ====================================
-- 8. IMPORTAÇÃO DE SESSÕES DE AULA
-- ====================================
INSERT INTO public.class_sessions (
    id, 
    class_id, 
    session_date, 
    session_time, 
    topic, 
    description, 
    status
) VALUES
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-01-16', '19:00:00', 'Introdução à Teologia', 'Apresentação do curso e conceitos básicos', 'completed'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-01-18', '19:00:00', 'A Natureza de Deus', 'Estudo sobre os atributos divinos', 'completed'),
('llllllll-llll-llll-llll-llllllllllll', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-01-23', '19:00:00', 'A Trindade', 'Doutrina da Santíssima Trindade', 'scheduled'),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-02-02', '20:00:00', 'Igreja Primitiva', 'Os primeiros cristãos', 'completed');

-- ====================================
-- 9. IMPORTAÇÃO DE FREQUÊNCIA/ATTENDANCES
-- ====================================
INSERT INTO public.attendances (
    id, 
    student_id, 
    class_id, 
    session_id, 
    date, 
    status, 
    notes
) VALUES
-- Frequência da sessão de 16/01/2024
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '2024-01-16', 'presente', 'Participação ativa'),
('oooooooo-oooo-oooo-oooo-oooooooooooo', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '2024-01-16', 'presente', NULL),

-- Frequência da sessão de 18/01/2024
('pppppppp-pppp-pppp-pppp-pppppppppppp', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '2024-01-18', 'presente', NULL),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '2024-01-18', 'falta', 'Justificou ausência'),

-- Frequência da sessão de História da Igreja
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '2024-02-02', 'presente', 'Excelente participação'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '2024-02-02', 'presente', NULL);

-- ====================================
-- 10. IMPORTAÇÃO DE NOTAS/GRADES
-- ====================================
INSERT INTO public.grades (
    id, 
    student_id, 
    class_id, 
    assessment_type, 
    grade, 
    max_grade, 
    weight, 
    date, 
    notes
) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Prova 1', 8.5, 10.0, 1.0, '2024-02-15', 'Bom desempenho'),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', '88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Prova 1', 9.0, 10.0, 1.0, '2024-02-15', 'Excelente'),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', '99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Trabalho', 7.5, 10.0, 0.5, '2024-02-20', 'Entregue no prazo'),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Trabalho', 8.0, 10.0, 0.5, '2024-02-20', 'Boa pesquisa');

-- ====================================
-- INSTRUÇÕES DE USO:
-- ====================================

/*
IMPORTANTE: 
1. Substitua os UUIDs dos profiles pelos IDs reais dos usuários criados no auth.users
2. Ajuste as datas conforme necessário
3. Execute as queries na ordem apresentada para respeitar as dependências
4. Verifique se todos os relacionamentos estão corretos antes da importação

ORDEM DE EXECUÇÃO:
1. Congregações
2. Campos  
3. Cursos
4. Disciplinas
5. Membros/Profiles
6. Turmas/Classes
7. Matrículas/Enrollments
8. Sessões de Aula
9. Frequência/Attendances
10. Notas/Grades

Para verificar a importação:
- SELECT COUNT(*) FROM congregations;
- SELECT COUNT(*) FROM fields;
- SELECT COUNT(*) FROM profiles;
- SELECT COUNT(*) FROM attendances;
*/