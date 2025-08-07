import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  // Compatibilidade com código antigo
  start_date?: string;
  end_date?: string;
  location?: string;
  max_attendees?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  class_id?: string;
  event_type: string;
  status: string;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  // Compatibilidade com código antigo
  person_id?: string;
  person_name?: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  verification_method: string;
  created_at: string;
  confirmed_at?: string;
  certificate_printed?: boolean;
}

export function useEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar eventos
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_datetime,
          end_datetime,
          location,
          max_attendees,
          created_by,
          created_at,
          updated_at,
          class_id,
          event_type,
          status
        `)
        .order('start_datetime', { ascending: false });

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        throw error;
      }

      return data.map(event => ({
        ...event,
        // Compatibilidade com o formato antigo
        start_date: event.start_datetime,
        end_date: event.end_datetime
      }));
    }
  });

  // Buscar presenças de eventos
  const { data: attendances = [] } = useQuery({
    queryKey: ['event-attendances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          event_id,
          student_id,
          status,
          check_in_time,
          check_out_time,
          notes,
          verification_method,
          created_at,
          profiles:student_id (
            full_name,
            cpf
          )
        `)
        .not('event_id', 'is', null);

      if (error) {
        console.error('Erro ao buscar presenças:', error);
        throw error;
      }

      return data.map(record => ({
        id: record.id,
        event_id: record.event_id,
        student_id: record.student_id,
        student_name: 'Nome não encontrado', // Será buscado do banco
        person_id: record.student_id, // Compatibilidade
        person_name: 'Nome não encontrado', // Compatibilidade
        status: record.status,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        notes: record.notes,
        verification_method: record.verification_method,
        created_at: record.created_at,
        confirmed_at: record.check_in_time || record.created_at,
        certificate_printed: false // TODO: implementar lógica de certificados
      }));
    }
  });

  // Criar evento
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
      // Buscar perfil do usuário logado para obter o UUID correto
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', '04816954350')
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado no sistema');
      }

      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          start_datetime: eventData.start_datetime,
          end_datetime: eventData.end_datetime,
          location: eventData.location,
          max_attendees: eventData.max_attendees,
          created_by: profile.id, // Usar UUID do perfil do usuário
          event_type: eventData.event_type || 'evento',
          status: eventData.status || 'agendado',
          class_id: eventData.class_id || null
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar evento:', error);
        throw error;
      }
      
      console.log('✅ Evento criado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation de evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o evento.",
        variant: "destructive",
      });
    }
  });

  // Confirmar presença
  const confirmAttendanceMutation = useMutation({
    mutationFn: async ({ eventId, studentId, studentName }: { 
      eventId: string; 
      studentId: string; 
      studentName: string; 
    }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([{
          event_id: eventId,
          student_id: studentId,
          status: 'presente',
          check_in_time: new Date().toISOString(),
          verification_method: 'manual',
          attendance_type: 'presenca'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendances'] });
      toast({
        title: "Presença confirmada",
        description: `Presença de ${variables.studentName} confirmada com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar a presença.",
        variant: "destructive",
      });
    }
  });

  const createEvent = async (eventData: any) => {
    return createEventMutation.mutateAsync({
      ...eventData,
      start_datetime: eventData.start_date || eventData.start_datetime,
      end_datetime: eventData.end_date || eventData.end_datetime
    });
  };

  const confirmAttendance = async (eventId: string, studentId: string, studentName: string) => {
    return confirmAttendanceMutation.mutateAsync({ eventId, studentId, studentName });
  };

  const getEventAttendances = (eventId: string) => {
    return attendances.filter(att => att.event_id === eventId);
  };

  return {
    events,
    attendances,
    isLoading: isLoading || createEventMutation.isPending || confirmAttendanceMutation.isPending,
    createEvent,
    confirmAttendance,
    getEventAttendances,
  };
}