import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsService, type NovaSubject, type AtualizarSubject } from '@/services/subjects.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsService.listar(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (subject: NovaSubject) => subjectsService.criar(subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar disciplina:', error);
      toast.error('Erro ao criar disciplina');
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtualizarSubject }) => 
      subjectsService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar disciplina:', error);
      toast.error('Erro ao atualizar disciplina');
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => subjectsService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover disciplina:', error);
      toast.error('Erro ao remover disciplina');
    },
  });
};

export const useProfessors = () => {
  return useQuery({
    queryKey: ['professors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'professor')
        .eq('status', 'ativo')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};