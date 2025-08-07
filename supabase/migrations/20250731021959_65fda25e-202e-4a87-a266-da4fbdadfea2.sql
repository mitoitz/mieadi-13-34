-- Insert de frequência na tabela attendances
-- Corrigindo a ordem dos campos e usando UUID válido para student_id
INSERT INTO public.attendances (student_id, class_id, session_id, date, status, notes) 
VALUES (
  'fc55e6a1-d2cc-4044-97e6-b62009d99265',  -- student_id (usando UUID válido)
  '30dcc878-fa41-476f-b4a0-c63a995466af',  -- class_id
  '6f9683cd-6f30-4489-bff7-e29be4ab579e',  -- session_id
  '2023-08-07',                             -- date
  'ausente',                                -- status
  NULL                                      -- notes
);