-- Verificar quais tabelas não têm RLS habilitado
SELECT schemaname, tablename
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename 
  FROM pg_policies 
  WHERE schemaname = 'public'
)
AND tablename NOT LIKE 'pg_%';