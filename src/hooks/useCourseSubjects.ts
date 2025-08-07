import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseSubjectsService, type NovaCourseSubject } from '@/services/course-subjects.service';
import { toast } from 'sonner';

export const useCourseSubjects = () => {
  return useQuery({
    queryKey: ['course-subjects'],
    queryFn: () => courseSubjectsService.listar(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCourseSubjectsByCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['course-subjects', 'by-course', courseId],
    queryFn: () => courseSubjectsService.listarPorCurso(courseId),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCourseSubjectsBySubject = (subjectId: string) => {
  return useQuery({
    queryKey: ['course-subjects', 'by-subject', subjectId],
    queryFn: () => courseSubjectsService.listarPorDisciplina(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAvailableSubjectsForCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['subjects', 'available-for-course', courseId],
    queryFn: () => courseSubjectsService.buscarDisciplinasDisponiveis(courseId),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddSubjectToCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: NovaCourseSubject) => 
      courseSubjectsService.adicionarDisciplinaAoCurso(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['course-subjects', 'by-course', variables.course_id] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'available-for-course', variables.course_id] });
      toast.success('Disciplina adicionada ao curso com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar disciplina ao curso:', error);
      toast.error('Erro ao adicionar disciplina ao curso');
    },
  });
};

export const useRemoveSubjectFromCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, subjectId }: { courseId: string; subjectId: string }) => 
      courseSubjectsService.removerDisciplinaDoCurso(courseId, subjectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['course-subjects', 'by-course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'available-for-course', variables.courseId] });
      toast.success('Disciplina removida do curso com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover disciplina do curso:', error);
      toast.error('Erro ao remover disciplina do curso');
    },
  });
};

export const useUpdateSubjectOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) => 
      courseSubjectsService.atualizarOrdem(id, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-subjects'] });
      toast.success('Ordem da disciplina atualizada!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao atualizar ordem da disciplina');
    },
  });
};

export const useToggleSubjectRequired = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isRequired }: { id: string; isRequired: boolean }) => 
      courseSubjectsService.alternarObrigatoria(id, isRequired),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-subjects'] });
      toast.success('Status da disciplina atualizado!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da disciplina');
    },
  });
};