-- Create campos table as alias/view to fields table for compatibility
-- This ensures any code expecting 'campos' will work with existing 'fields' data

CREATE VIEW public.campos AS 
SELECT 
  id,
  name AS nome,
  description AS descricao,
  responsible_id AS coordenador_id,
  created_at,
  updated_at
FROM public.fields;

-- Grant appropriate permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campos TO anon;