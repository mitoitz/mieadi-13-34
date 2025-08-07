-- Adicionar valores faltantes ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pastor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretario';

-- Cadastrar todos os pastores das congregações como pessoas no sistema
-- Inserir pastores das congregações que ainda não estão cadastrados como pessoas
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  cpf, 
  phone, 
  address, 
  role, 
  status, 
  congregation_id, 
  ministerial_position,
  member_since,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  COALESCE(c.pastor_name, 'Pastor ' || c.name) as full_name,
  COALESCE(c.email, LOWER(REPLACE(COALESCE(c.pastor_name, 'Pastor ' || c.name), ' ', '.')) || '@' || LOWER(REPLACE(c.name, ' ', '')) || '.com') as email,
  '000.000.000-' || LPAD((ROW_NUMBER() OVER())::text, 2, '0') as cpf,
  c.phone,
  c.address,
  'pastor'::user_role as role,
  'ativo'::user_status as status,
  c.id as congregation_id,
  'Pastor Titular' as ministerial_position,
  CURRENT_DATE - INTERVAL '1 year' as member_since,
  NOW() as created_at,
  NOW() as updated_at
FROM public.congregations c
WHERE c.pastor_name IS NOT NULL 
  AND c.pastor_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.congregation_id = c.id 
    AND p.role = 'pastor'
    AND p.ministerial_position = 'Pastor Titular'
  );

-- Atualizar congregações que não têm pastor_name definido
UPDATE public.congregations 
SET pastor_name = 'Pr. ' || SPLIT_PART(name, ' ', 1) || ' Silva'
WHERE pastor_name IS NULL OR pastor_name = '';

-- Inserir pastores para congregações que foram atualizadas
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  cpf, 
  phone, 
  address, 
  role, 
  status, 
  congregation_id, 
  ministerial_position,
  member_since,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  c.pastor_name as full_name,
  LOWER(REPLACE(c.pastor_name, ' ', '.')) || '@' || LOWER(REPLACE(c.name, ' ', '')) || '.com' as email,
  '000.000.000-' || LPAD((50 + ROW_NUMBER() OVER())::text, 2, '0') as cpf,
  c.phone,
  c.address,
  'pastor'::user_role as role,
  'ativo'::user_status as status,
  c.id as congregation_id,
  'Pastor Titular' as ministerial_position,
  CURRENT_DATE - INTERVAL '2 years' as member_since,
  NOW() as created_at,
  NOW() as updated_at
FROM public.congregations c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.congregation_id = c.id 
  AND p.role = 'pastor'
  AND p.ministerial_position = 'Pastor Titular'
);