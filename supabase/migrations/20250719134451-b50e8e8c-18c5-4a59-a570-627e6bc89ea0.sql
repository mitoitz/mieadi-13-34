-- Import congregations (small batch)
INSERT INTO public.congregations (id, name, address, city, state, postal_code, phone, email, pastor_name) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Igreja Central', 'Rua Principal, 123', 'São Paulo', 'SP', '01234-567', '(11) 1234-5678', 'central@igreja.com', 'Pastor João Silva'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Igreja Norte', 'Av. Norte, 456', 'Rio de Janeiro', 'RJ', '12345-678', '(21) 2345-6789', 'norte@igreja.com', 'Pastor Maria Santos'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Igreja Sul', 'Rua Sul, 789', 'Belo Horizonte', 'MG', '23456-789', '(31) 3456-7890', 'sul@igreja.com', 'Pastor Pedro Costa');