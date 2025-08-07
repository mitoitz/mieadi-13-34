-- Fix the campos view to be updatable and handle the column mapping properly
DROP VIEW IF EXISTS public.campos;

-- Create a proper updatable view with instead-of triggers
CREATE VIEW public.campos AS 
SELECT 
  id,
  name AS nome,
  description AS descricao,
  responsible_id AS coordenador_id,
  created_at,
  updated_at
FROM public.fields;

-- Create INSTEAD OF triggers to make the view updatable
CREATE OR REPLACE FUNCTION handle_campos_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fields (id, name, description, responsible_id, created_at, updated_at)
    VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.nome,
        NEW.descricao,
        NEW.coordenador_id,
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION handle_campos_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fields SET
        name = NEW.nome,
        description = NEW.descricao,
        responsible_id = NEW.coordenador_id,
        updated_at = now()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION handle_campos_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.fields WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the triggers
CREATE TRIGGER campos_insert_trigger
    INSTEAD OF INSERT ON public.campos
    FOR EACH ROW EXECUTE FUNCTION handle_campos_insert();

CREATE TRIGGER campos_update_trigger
    INSTEAD OF UPDATE ON public.campos
    FOR EACH ROW EXECUTE FUNCTION handle_campos_update();

CREATE TRIGGER campos_delete_trigger
    INSTEAD OF DELETE ON public.campos
    FOR EACH ROW EXECUTE FUNCTION handle_campos_delete();

-- Enable RLS on the view (inherits from fields table)
ALTER VIEW public.campos SET (security_barrier = true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campos TO anon;