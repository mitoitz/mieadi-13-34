-- Criar tabela para configurações do sistema
CREATE TABLE public.system_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_name TEXT NOT NULL DEFAULT 'MIEADI - Sistema Eclesiástico',
  version TEXT NOT NULL DEFAULT '1.0.0',
  license_key TEXT,
  max_users INTEGER DEFAULT 1000,
  expiration_date DATE,
  features JSONB DEFAULT '{"multiTenant": false, "auditLog": true, "backup": true, "customization": false}'::jsonb,
  customization JSONB DEFAULT '{"logo_url": "", "primary_color": "#3b82f6", "secondary_color": "#64748b", "success_color": "#10b981", "danger_color": "#ef4444", "footer_text": "", "terms_of_use": ""}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para licenças do sistema
CREATE TABLE public.system_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  organization_name TEXT,
  max_users INTEGER DEFAULT 100,
  features JSONB DEFAULT '{"multiTenant": false, "auditLog": true, "backup": true, "customization": false}'::jsonb,
  expiration_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para logs de administração
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas administrativas
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configurações do sistema (apenas admins podem acessar)
CREATE POLICY "Only admins can manage system configurations" 
ON public.system_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Políticas RLS para licenças do sistema (apenas admins podem acessar)
CREATE POLICY "Only admins can manage system licenses" 
ON public.system_licenses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Políticas RLS para logs administrativos (apenas admins podem visualizar)
CREATE POLICY "Only admins can view admin logs" 
ON public.admin_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Inserir configuração inicial do sistema
INSERT INTO public.system_configurations (
  system_name, 
  version, 
  max_users, 
  features,
  customization
) VALUES (
  'MIEADI - Sistema Eclesiástico',
  '1.0.0',
  1000,
  '{"multiTenant": false, "auditLog": true, "backup": true, "customization": false}'::jsonb,
  '{"logo_url": "", "primary_color": "#3b82f6", "secondary_color": "#64748b", "success_color": "#10b981", "danger_color": "#ef4444", "footer_text": "", "terms_of_use": ""}'::jsonb
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON public.system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_licenses_updated_at
  BEFORE UPDATE ON public.system_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();