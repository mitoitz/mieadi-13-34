import { supabase } from "@/integrations/supabase/client";
import type { SystemConfiguration } from "./types";

export class SystemConfigService {
  async getSystemConfiguration(): Promise<SystemConfiguration | null> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar configuração do sistema:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      features: typeof data.features === 'string' 
        ? JSON.parse(data.features) 
        : data.features as { multiTenant: boolean; auditLog: boolean; backup: boolean; customization: boolean; },
      customization: typeof data.customization === 'string'
        ? JSON.parse(data.customization)
        : data.customization as { logo_url: string; primary_color: string; secondary_color: string; success_color: string; danger_color: string; footer_text: string; terms_of_use: string; }
    };
  }

  async updateSystemConfiguration(config: Partial<SystemConfiguration>): Promise<boolean> {
    const currentConfig = await this.getSystemConfiguration();
    if (!currentConfig?.id) {
      console.error('Configuração do sistema não encontrada');
      return false;
    }

    const { error } = await supabase
      .from('system_configurations')
      .update(config)
      .eq('id', currentConfig.id);

    if (error) {
      console.error('Erro ao atualizar configuração do sistema:', error);
      return false;
    }

    return true;
  }
}