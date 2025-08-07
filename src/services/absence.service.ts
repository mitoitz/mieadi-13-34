import { supabase } from "@/integrations/supabase/client";

export interface AbsenceNotification {
  id: string;
  profile_id: string;
  days_absent: number;
  notification_date: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AwayModeData {
  away_mode: boolean;
  away_reason?: string;
  away_start_date?: string;
  away_end_date?: string;
}

export const absenceService = {
  // Marcar presença de uma pessoa (usa updated_at como proxy para presença)
  async markAttendance(personId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', personId);
    
    if (error) throw error;
  },

  // Criar notificação de ausência usando o sistema existente
  async createAbsenceNotification(personId: string, daysAbsent: number, fullName: string): Promise<void> {
    try {
      const message = `${fullName} está ausente há ${daysAbsent} dias. Considere entrar em contato.`;
      
      // Criar notificação geral para admins usando o sistema existente
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'coordenador'])
        .eq('status', 'ativo');

      if (admins) {
        for (const admin of admins) {
          await supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              title: `Ausência de ${daysAbsent} dias`,
              message,
              type: 'warning',
              read: false
            });
        }
      }
    } catch (error) {
      console.error('Error creating absence notification:', error);
    }
  },

  // Verificar ausências baseado no updated_at (última atividade)
  async checkAndNotifyAbsences(): Promise<void> {
    try {
      // Buscar pessoas ativas
      const { data: people, error } = await supabase
        .from('profiles')
        .select('id, full_name, updated_at')
        .eq('status', 'ativo');

      if (error) throw error;

      const today = new Date();
      
      for (const person of people || []) {
        const lastActivity = person.updated_at ? new Date(person.updated_at) : null;
        
        if (!lastActivity) continue;
        
        const daysAbsent = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        // Verificar se precisa notificar (30, 60, 90 dias)
        if ([30, 60, 90].includes(daysAbsent)) {
          // Verificar se já foi notificado hoje
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('title', `Ausência de ${daysAbsent} dias`)
            .contains('message', person.full_name)
            .gte('created_at', new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString());

          if (!existingNotification || existingNotification.length === 0) {
            await this.createAbsenceNotification(person.id, daysAbsent, person.full_name);
          }
        }
      }
    } catch (error) {
      console.error('Error checking absences:', error);
    }
  },

  // Buscar relatório de ausências baseado no updated_at
  async getAbsenceReport(): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        updated_at,
        role,
        status,
        congregations:congregation_id (name),
        fields:field_id (name)
      `)
      .eq('status', 'ativo')
      .order('updated_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(person => {
      const lastActivity = person.updated_at ? new Date(person.updated_at) : null;
      const today = new Date();
      const daysAbsent = lastActivity ? 
        Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 
        null;

      return {
        ...person,
        days_absent: daysAbsent,
        last_activity: lastActivity?.toLocaleDateString('pt-BR'),
        absence_status: daysAbsent === null ? 'Sem registro' :
                       daysAbsent >= 90 ? 'Crítico (90+ dias)' :
                       daysAbsent >= 60 ? 'Alto (60+ dias)' :
                       daysAbsent >= 30 ? 'Moderado (30+ dias)' :
                       'Normal'
      };
    });
  }
};