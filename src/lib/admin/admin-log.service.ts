import { supabase } from "@/integrations/supabase/client";
import type { AdminLog } from "./types";

export class AdminLogService {
  async logAdminAction(action: string, description?: string): Promise<void> {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) return;

    try {
      const session = JSON.parse(adminSession);
      await supabase
        .from('admin_logs')
        .insert([{
          admin_username: session.username,
          action,
          description,
          ip_address: null, // Seria obtido do servidor em produção
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }

    return (data || []).map(log => ({
      ...log,
      ip_address: log.ip_address?.toString() || undefined
    }));
  }
}