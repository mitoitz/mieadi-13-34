import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { academicCalculationsService } from '@/services/academic-calculations.service';

// Types simplificados para compatibilidade com Supabase atual
export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  grade_value: number;
  assessment_type: 'prova' | 'trabalho' | 'participacao' | 'seminario' | 'atividade';
  assessment_date: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentGradeSummary {
  student_id: string;
  student_name: string;
  subject_id: string;
  subject_name: string;
  average_grade: number;
  total_assessments: number;
  status: 'aprovado' | 'reprovado' | 'pendente';
}

// React Query hooks para o sistema acadêmico (usando dados mock por enquanto)
export function useStudentGrades(studentId?: string, subjectId?: string) {
  return useQuery<Grade[]>({
    queryKey: ['academic', 'grades', { studentId, subjectId }],
    queryFn: async () => {
      // Dados mock - tabela grades será implementada na próxima fase
      const mockGrades: Grade[] = [
        {
          id: '1',
          student_id: studentId || '1',
          subject_id: subjectId || '1',
          class_id: '1',
          grade_value: 8.5,
          assessment_type: 'prova',
          assessment_date: new Date().toISOString().split('T')[0],
          observations: 'Excelente desempenho',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          student_id: studentId || '2',
          subject_id: subjectId || '1',
          class_id: '1',
          grade_value: 7.0,
          assessment_type: 'trabalho',
          assessment_date: new Date().toISOString().split('T')[0],
          observations: 'Bom desenvolvimento',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      return mockGrades;
    },
    enabled: !!(studentId || subjectId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentGradeSummary(classId?: string) {
  return useQuery<StudentGradeSummary[]>({
    queryKey: ['academic', 'grade-summary', classId],
    queryFn: async () => {
      // Esta query seria mais complexa no Supabase real
      // Por agora, retorna dados mock estruturados
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          profiles!enrollments_student_id_fkey(full_name),
          classes!enrollments_class_id_fkey(
            id,
            name,
            subject:subjects(id, name)
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Calcular médias e status (mock implementation)
      const summaries: StudentGradeSummary[] = (enrollments || []).map(enrollment => {
        const profile = Array.isArray(enrollment.profiles) ? enrollment.profiles[0] : enrollment.profiles;
        const classInfo = Array.isArray(enrollment.classes) ? enrollment.classes[0] : enrollment.classes;
        const subject = Array.isArray(classInfo?.subject) ? classInfo?.subject[0] : classInfo?.subject;
        
        return {
          student_id: enrollment.student_id,
          student_name: profile?.full_name || '',
          subject_id: subject?.id || '',
          subject_name: subject?.name || '',
          average_grade: Math.random() * 10, // Mock - seria calculado das notas reais
          total_assessments: Math.floor(Math.random() * 5) + 1,
          status: Math.random() > 0.2 ? 'aprovado' : 'pendente' as const
        };
      });

      return summaries;
    },
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (grade: Omit<Grade, 'id' | 'created_at' | 'updated_at'>) => {
      // Mock implementation - tabela grades será implementada na próxima fase
      console.log('Creating grade:', grade);
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic'] });
      toast.success('Nota registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating grade:', error);
      toast.error('Erro ao registrar nota');
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ gradeId, updates }: { gradeId: string; updates: Partial<Grade> }) => {
      // Mock implementation
      console.log('Updating grade:', gradeId, updates);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic'] });
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
      // Mock implementation
      console.log('Deleting grade:', gradeId);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic'] });
      toast.success('Nota removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting grade:', error);
      toast.error('Erro ao remover nota');
    },
  });
}

// Hooks para cálculos acadêmicos
export function useStudentAcademicProgress(studentId: string) {
  return useQuery({
    queryKey: ['academic', 'progress', studentId],
    queryFn: () => academicCalculationsService.calculateAcademicProgress(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useRecalculateGrades() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (studentId: string) => 
      academicCalculationsService.calculateStudentGrades(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic'] });
      toast.success('Notas recalculadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error recalculating grades:', error);
      toast.error('Erro ao recalcular notas');
    },
  });
}