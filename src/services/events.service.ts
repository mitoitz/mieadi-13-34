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
    
    // 1) Verificar duplicidade por title + start_datetime
    const { data: existing, error: findError } = await supabase
      .from('events')
      .select('*')
      .eq('title', evento.title)
      .eq('start_datetime', evento.start_datetime)
      .maybeSingle();

    if (findError) {
      console.error('❌ Erro ao verificar evento existente:', findError);
      throw findError;
    }

    if (existing) {
      console.log('↩️ Usando evento existente (title + start_datetime):', existing.id);
      return existing as Event;
    }

    // 2) Não existe: criar normalmente
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
    
    // Se tiver event_id, usar RPC (deduplicação/validação)
    if (registro.event_id) {
      const { data: rpcId, error: rpcErr } = await supabase.rpc(
        'insert_attendance_by_legacy_or_fingerprint',
        {
          p_student_id: registro.student_id,
          p_status: registro.status || 'presente',
          p_verification_method: registro.verification_method || 'manual',
          p_check_in_time: registro.check_in_time || new Date().toISOString(),
          p_check_out_time: registro.check_out_time || null,
          p_notes: registro.notes || null,
          p_event_id: registro.event_id
        }
      );
      if (rpcErr) {
        console.error('❌ Erro ao inserir via RPC:', rpcErr);
        throw rpcErr;
      }
      const { data: fullRecord, error: fetchErr } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', rpcId as string)
        .single();
      if (fetchErr) throw fetchErr;
      console.log('✅ Frequência registrada (RPC):', fullRecord);
      return fullRecord as AttendanceRecord;
    }
    
    // Sem event_id: inserir diretamente (ex.: presença por turma)
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
    return data as AttendanceRecord;
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
