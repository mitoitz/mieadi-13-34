import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentGrade {
  id: string;
  student_id: string;
  class_id: string;
  grade: number;
  max_grade: number;
  weight: number;
  assessment_type: string;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useStudentGrades(studentId?: string, classId?: string) {
  return useQuery<StudentGrade[]>({
    queryKey: ['grades', studentId, classId],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select('*')
        .order('date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StudentGrade[];
    },
    enabled: !!(studentId || classId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (grade: Omit<StudentGrade, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('grades')
        .insert(grade)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota lançada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating grade:', error);
      toast.error('Erro ao lançar nota');
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ gradeId, updates }: { gradeId: string; updates: Partial<StudentGrade> }) => {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', gradeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating grade:', error);
      toast.error('Erro ao atualizar nota');
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (gradeId: string) => {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting grade:', error);
      toast.error('Erro ao remover nota');
    },
  });
}

export function useStudentAverage(studentId: string, classId?: string) {
  return useQuery<number>({
    queryKey: ['student-average', studentId, classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_student_average', {
          student_uuid: studentId,
          class_uuid: classId || null
        });

      if (error) throw error;
      return data || 0;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}