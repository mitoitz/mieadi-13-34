import { supabase } from "@/integrations/supabase/client";
import type { SystemStats } from "./types";

export class StatsService {
  async getSystemStats(): Promise<SystemStats> {
    try {
      // Contar licenças ativas
      const { count: activeLicenses } = await supabase
        .from('system_licenses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Contar total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Contar congregações
      const { count: totalCongregations } = await supabase
        .from('congregations')
        .select('*', { count: 'exact', head: true });

      return {
        activeLicenses: activeLicenses || 0,
        totalUsers: totalUsers || 0,
        totalCongregations: totalCongregations || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        activeLicenses: 0,
        totalUsers: 0,
        totalCongregations: 0
      };
    }
  }
}