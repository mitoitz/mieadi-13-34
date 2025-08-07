-- Criar função para definir senha padrão em novos usuários
CREATE OR REPLACE FUNCTION public.set_default_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não tem password_hash definido, configurar senha padrão "mudar123"
  IF NEW.password_hash IS NULL THEN
    NEW.password_hash = '$2b$10$eQ7LstmX4FJP0VzrjJqeKOEZBFbZZCHY6FN1qJCXsJLWbGV8FQPr.';
  END IF;
  
  -- Garantir que seja marcado como primeiro login
  IF NEW.first_login IS NULL THEN
    NEW.first_login = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para aplicar senha padrão em inserções
DROP TRIGGER IF EXISTS set_default_password_trigger ON public.profiles;
CREATE TRIGGER set_default_password_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_password();