import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turmasService } from '@/services/turmas.service';
import type { NovaTurma, AtualizarTurma } from '@/services/turmas.service';
import { toast } from 'sonner';

export const useTurmas = () => {
  return useQuery({
    queryKey: ['turmas'],
    queryFn: () => turmasService.listar(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateTurma = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (turma: NovaTurma) => turmasService.criar(turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar turma:', error);
      toast.error('Erro ao criar turma');
    },
  });
};

export const useUpdateTurma = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtualizarTurma }) => 
      turmasService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar turma:', error);
      toast.error('Erro ao atualizar turma');
    },
  });
};

export const useDeleteTurma = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => turmasService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover turma:', error);
      toast.error(error.message || 'Erro ao remover turma');
    },
  });
};

export const useDeactivateTurma = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => turmasService.desativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      toast.success('Turma desativada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao desativar turma:', error);
      toast.error('Erro ao desativar turma');
    },
  });
};