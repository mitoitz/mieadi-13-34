import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesService, type NovoCourse, type AtualizarCourse } from '@/services/courses.service';
import { toast } from 'sonner';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('🔄 Buscando cursos...');
      const data = await coursesService.listar();
      console.log('✅ Cursos carregados:', data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (course: NovoCourse) => {
      console.log('🔄 Criando curso:', course);
      const result = await coursesService.criar(course);
      console.log('✅ Curso criado:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar curso:', error);
      toast.error('Erro ao criar curso: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtualizarCourse }) => 
      coursesService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar curso:', error);
      toast.error('Erro ao atualizar curso');
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => coursesService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover curso:', error);
      toast.error('Erro ao remover curso');
    },
  });
};