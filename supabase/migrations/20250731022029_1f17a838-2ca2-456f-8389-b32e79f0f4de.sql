-- Insert de frequência na tabela attendances com student_id válido
INSERT INTO public.attendances (student_id, class_id, session_id, date, status, notes) 
VALUES (
  'a6cc4a3a-de2c-489e-b6c5-ab14febcb3bf',  -- student_id (Joao Teste - aluno existente)
  '30dcc878-fa41-476f-b4a0-c63a995466af',  -- class_id
  '6f9683cd-6f30-4489-bff7-e29be4ab579e',  -- session_id
  '2023-08-07',                             -- date
  'ausente',                                -- status
  NULL                                      -- notes
);