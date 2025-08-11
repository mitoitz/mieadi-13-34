import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  event_type: string;
  status: string;
  class_id?: string;
  max_attendees?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventWithClass extends Event {
  class?: {
    id: string;
    name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  event_id?: string;
  class_id?: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  verification_method: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export const eventsService = {
  async listar(): Promise<EventWithClass[]> {
    console.log('🔄 Buscando eventos...');
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          class:classes(
            id,
            name
          )
        `)
        .order('start_datetime', { ascending: true });

      if (error) {
        console.error('❌ Erro na query de eventos:', error);
        throw error;
      }
      
      console.log('✅ Eventos carregados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no serviço de eventos:', error);
      throw error;
    }
  },

  async buscarPorId(id: string): Promise<EventWithClass | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        class:classes(
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async criar(evento: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    console.log('🔄 Criando evento:', evento);
    
    const { data, error } = await supabase
      .from('events')
      .insert(evento)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
    
    console.log('✅ Evento criado:', data);
    return data;
  },

  async atualizar(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Frequência/Attendance
  async registrarFrequencia(registro: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceRecord> {
    console.log('🔄 Registrando frequência:', registro);
    
    // Validar existência do evento (se fornecido)
    if (registro.event_id) {
      const { data: ev, error: evErr } = await supabase
        .from('events')
        .select('id')
        .eq('id', registro.event_id)
        .maybeSingle();
      if (evErr) {
        console.error('❌ Erro ao validar evento:', evErr);
        throw evErr;
      }
      if (!ev) {
        throw new Error('Evento não encontrado ou removido. Atualize e selecione um evento válido.');
      }
    }
    
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(registro)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao registrar frequência:', error);
      throw error;
    }
    
    console.log('✅ Frequência registrada:', data);
    return data;
  },

  async buscarFrequenciaEvento(eventId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        student:profiles!attendance_records_student_id_fkey(
          id,
          full_name,
          email,
          cpf
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async buscarFrequenciaAula(classId: string, date?: string): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        student:profiles!attendance_records_student_id_fkey(
          id,
          full_name,
          email,
          cpf
        )
      `)
      .eq('class_id', classId);

    if (date) {
      query = query.gte('created_at', `${date}T00:00:00`)
                  .lt('created_at', `${date}T23:59:59`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async atualizarFrequencia(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};