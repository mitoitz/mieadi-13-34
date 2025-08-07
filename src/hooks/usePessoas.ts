import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pessoasService, type NovaPessoa } from '@/services/pessoas.service';
import { toast } from 'sonner';
import { useState } from 'react';

export const usePessoas = () => {
  return useQuery({
    queryKey: ['pessoas'],
    queryFn: async () => {
      console.log('🔄 Buscando pessoas...');
      const data = await pessoasService.listar();
      console.log('✅ Pessoas carregadas:', data?.length || 0);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const usePessoasPaginadas = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 100;

  const query = useQuery({
    queryKey: ['pessoas-paginadas', page, searchTerm],
    queryFn: async () => {
      console.log('🔄 Buscando pessoas paginadas...');
      const data = await pessoasService.listarPaginado(page, limit, searchTerm);
      console.log('✅ Página carregada:', data.items.length, 'de', data.totalCount);
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (menor que não-paginado)
    placeholderData: (previousData) => previousData, // Manter dados anteriores durante carregamento
  });

  return {
    ...query,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    limit,
    // Helpers para navegação
    nextPage: () => setPage(prev => prev + 1),
    prevPage: () => setPage(prev => Math.max(0, prev - 1)),
    goToPage: (newPage: number) => setPage(newPage),
    search: (term: string) => {
      setSearchTerm(term);
      setPage(0); // Reset para primeira página ao pesquisar
    },
    clearSearch: () => {
      setSearchTerm('');
      setPage(0);
    }
  };
};

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('🔄 Buscando alunos...');
      const data = await pessoasService.listar();
      const students = data?.filter(person => person.role === 'aluno') || [];
      console.log('✅ Alunos carregados:', students.length);
      return students;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreatePessoa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pessoa: Omit<NovaPessoa, 'id'>) => {
      console.log('🔄 Criando pessoa:', pessoa);
      const result = await pessoasService.criar(pessoa);
      console.log('✅ Pessoa criada:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Pessoa criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar pessoa:', error);
      toast.error('Erro ao criar pessoa: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

export const useUpdatePessoa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NovaPessoa> }) => 
      pessoasService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Pessoa atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar pessoa:', error);
      toast.error('Erro ao atualizar pessoa');
    },
  });
};

export const useDeletePessoa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => pessoasService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Pessoa removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover pessoa:', error);
      toast.error('Erro ao remover pessoa');
    },
  });
};