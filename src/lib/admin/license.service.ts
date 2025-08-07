import { supabase } from "@/integrations/supabase/client";
import type { SystemLicense } from "./types";

export class LicenseService {
  async getSystemLicenses(): Promise<SystemLicense[]> {
    const { data, error } = await supabase
      .from('system_licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar licenças:', error);
      return [];
    }

    return (data || []).map(license => ({
      ...license,
      features: typeof license.features === 'string' 
        ? JSON.parse(license.features) 
        : license.features as { multiTenant: boolean; auditLog: boolean; backup: boolean; customization: boolean; },
      status: (license.status || 'active') as 'active' | 'expired' | 'suspended',
      max_users: license.max_users || 100,
      organization_name: license.organization_name || undefined
    }));
  }

  async createSystemLicense(license: Omit<SystemLicense, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('system_licenses')
      .insert([license]);

    if (error) {
      console.error('Erro ao criar licença:', error);
      return false;
    }

    return true;
  }

  async updateSystemLicense(id: string, license: Partial<SystemLicense>): Promise<boolean> {
    const { error } = await supabase
      .from('system_licenses')
      .update(license)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar licença:', error);
      return false;
    }

    return true;
  }

  async deleteSystemLicense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('system_licenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar licença:', error);
      return false;
    }

    return true;
  }

  generateLicenseKey(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `MIEADI-${timestamp}-${random}`;
  }
}