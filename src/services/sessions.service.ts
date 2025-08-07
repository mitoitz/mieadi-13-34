import { supabase } from "@/integrations/supabase/client";

export interface ClassSession {
  id: string;
  class_id: string;
  session_date: string;
  session_time?: string;
  topic?: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  session_id?: string;
  date: string;
  status: 'presente' | 'ausente' | 'justificado';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const sessionsService = {
  async getClassSessions(classId: string): Promise<ClassSession[]> {
    const { data, error } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(session => ({
      ...session,
      status: (session.status || 'scheduled') as 'scheduled' | 'completed' | 'cancelled'
    }));
  },

  async createSession(session: Omit<ClassSession, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase
      .from('class_sessions')
      .insert(session);

    if (error) throw error;
  },

  async updateSession(sessionId: string, updates: Partial<ClassSession>): Promise<void> {
    const { error } = await supabase
      .from('class_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('class_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  async getSessionAttendance(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        *,
        student:profiles!attendances_student_id_fkey(
          full_name,
          email
        )
      `)
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  },

  async recordAttendance(attendance: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase
      .from('attendances')
      .insert(attendance);

    if (error) throw error;
  },

  async updateAttendance(attendanceId: string, status: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('attendances')
      .update({ status, notes })
      .eq('id', attendanceId);

    if (error) throw error;
  }
};