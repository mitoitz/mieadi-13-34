import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classSubjectsService, type NovaClassSubject } from '@/services/class-subjects.service';
import { toast } from 'sonner';

export const useClassSubjects = (classId: string) => {
  return useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => classSubjectsService.listarPorTurma(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useAddClassSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (classSubject: NovaClassSubject) => classSubjectsService.adicionar(classSubject),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects', variables.class_id] });
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Disciplina adicionada à turma com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar disciplina à turma:', error);
      toast.error('Erro ao adicionar disciplina à turma');
    },
  });
};

export const useRemoveClassSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => classSubjectsService.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Disciplina removida da turma com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover disciplina da turma:', error);
      toast.error('Erro ao remover disciplina da turma');
    },
  });
};

export const useAddMultipleClassSubjects = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) => 
      classSubjectsService.adicionarMultiplasDisciplinas(classId, subjectIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success(`${variables.subjectIds.length} disciplinas adicionadas à turma!`);
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar disciplinas à turma:', error);
      toast.error('Erro ao adicionar disciplinas à turma');
    },
  });
};