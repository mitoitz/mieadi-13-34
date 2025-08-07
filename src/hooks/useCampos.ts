import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { camposService, type Campo, type NovoCampo } from '@/services/campos.service';
import { toast } from 'sonner';

export const useCampos = () => {
  return useQuery({
    queryKey: ['campos'],
    queryFn: async () => {
      console.log('🔄 Buscando campos...');
      const data = await camposService.listar();
      console.log('✅ Campos carregados:', data?.length || 0);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateCampo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campo: NovoCampo) => {
      console.log('🔄 Criando campo:', campo);
      const result = await camposService.criar(campo);
      console.log('✅ Campo criado:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] });
      toast.success('Campo criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar campo:', error);
      toast.error('Erro ao criar campo: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

export const useUpdateCampo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NovoCampo> }) => 
      camposService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] });
      toast.success('Campo atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar campo:', error);
      toast.error('Erro ao atualizar campo');
    },
  });
};

export const useDeleteCampo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => camposService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] });
      toast.success('Campo removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover campo:', error);
      toast.error('Erro ao remover campo');
    },
  });
};