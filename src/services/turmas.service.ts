import { supabase } from "@/integrations/supabase/client";

export type Turma = {
  id: string;
  name: string;
  subject_id: string | null;
  professor_id: string | null;
  congregation_id: string | null;
  schedule: string | null;
  max_students: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type NovaTurma = Omit<Turma, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AtualizarTurma = Partial<NovaTurma>;

export const turmasService = {
  async listar() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        subjects:subject_id (id, name),
        profiles:professor_id (id, full_name),
        congregations:congregation_id (id, name),
        enrollments!inner (
          id,
          student_id,
          status,
          student:profiles!enrollments_student_id_fkey (
            id,
            full_name
          )
        ),
        class_subjects (
          id,
          subject_id,
          order_index,
          is_primary,
          subjects (id, name, code, credits)
        )
      `)
      .order('name');
    
    if (error) throw error;
    
    // Filtrar apenas matrículas ativas na contagem
    const filteredData = data?.map(turma => ({
      ...turma,
      enrollments: turma.enrollments?.filter((enrollment: any) => 
        enrollment.status === 'ativa'
      ) || []
    }));
    
    return filteredData;
  },

  async criar(turma: NovaTurma) {
    console.log('🔄 Criando turma:', turma);
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert(turma)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao criar turma:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erro ao criar turma: ${error.message}`);
      }

      console.log('✅ Turma criada com sucesso:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Erro geral ao criar turma:', error);
      throw error;
    }
  },

  async atualizar(id: string, turma: AtualizarTurma) {
    const { data, error } = await supabase
      .from('classes')
      .update(turma)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletar(id: string) {
    // Verificar se existem registros relacionados
    const { data: attendances } = await supabase
      .from('attendances')
      .select('id')
      .eq('class_id', id)
      .limit(1);
    
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('status', 'ativa')
      .limit(1);
    
    const { data: attendanceRecords } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('class_id', id)
      .limit(1);
    
    // Se há registros relacionados, oferecer alternativas
    if (attendances && attendances.length > 0) {
      throw new Error('Esta turma possui registros de frequência. Use "Desativar Turma" para manter o histórico ou contate o diretor para limpeza completa dos dados.');
    }
    
    if (attendanceRecords && attendanceRecords.length > 0) {
      throw new Error('Esta turma possui registros de presença. Use "Desativar Turma" para manter o histórico.');
    }
    
    if (enrollments && enrollments.length > 0) {
      throw new Error('Esta turma possui alunos ativos. Cancele todas as matrículas antes de excluir.');
    }
    
    // Se não há impedimentos, excluir a turma
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async desativar(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .update({ status: 'inativa' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        subjects:subject_id (id, name),
        profiles:professor_id (id, full_name),
        congregations:congregation_id (id, name),
        enrollments!inner (
          id,
          student_id,
          status,
          student:profiles!enrollments_student_id_fkey (
            id,
            full_name
          )
        ),
        class_subjects (
          id,
          subject_id,
          order_index,
          is_primary,
          subjects (id, name, code, credits)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Filtrar apenas matrículas ativas
    if (data) {
      data.enrollments = data.enrollments?.filter((enrollment: any) => 
        enrollment.status === 'ativa'
      ) || [];
    }
    
    return data;
  }
};