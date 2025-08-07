import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { congregacoesService, type Congregacao, type NovaCongregarao } from '@/services/congregacoes.service';
import { toast } from 'sonner';

export const useCongregacoes = () => {
  return useQuery({
    queryKey: ['congregacoes'],
    queryFn: async () => {
      console.log('🔄 Buscando congregações...');
      const data = await congregacoesService.listar();
      console.log('✅ Congregações carregadas:', data?.length || 0);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateCongregacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (congregacao: NovaCongregarao) => {
      console.log('🔄 Criando congregação:', congregacao);
      const result = await congregacoesService.criar(congregacao);
      console.log('✅ Congregação criada:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['congregacoes'] });
      toast.success('Congregação criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar congregação:', error);
      toast.error('Erro ao criar congregação: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

export const useUpdateCongregacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Congregacao> }) => 
      congregacoesService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['congregacoes'] });
      toast.success('Congregação atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar congregação:', error);
      toast.error('Erro ao atualizar congregação');
    },
  });
};

export const useDeleteCongregacao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => congregacoesService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['congregacoes'] });
      toast.success('Congregação removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover congregação:', error);
      toast.error('Erro ao remover congregação');
    },
  });
};