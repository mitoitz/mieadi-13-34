import { useState, useEffect } from 'react';
import { indicacoesService, MemberIndication, CreateIndicationData } from '@/services/indicacoes.service';
import { useToast } from '@/hooks/use-toast';

export function useIndications(pastorId?: string) {
  const [indications, setIndications] = useState<MemberIndication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIndications = async () => {
    if (!pastorId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await indicacoesService.getIndicationsByPastor(pastorId);
      setIndications(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar indicações';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createIndication = async (data: CreateIndicationData) => {
    try {
      setLoading(true);
      const newIndication = await indicacoesService.createIndication(data);
      setIndications(prev => [newIndication, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Indicação criada com sucesso!"
      });
      
      return newIndication;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar indicação';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateIndicationStatus = async (
    indicationId: string, 
    status: 'pendente' | 'aprovada' | 'rejeitada'
  ) => {
    try {
      setLoading(true);
      await indicacoesService.updateIndicationStatus(indicationId, status);
      
      setIndications(prev => 
        prev.map(indication => 
          indication.id === indicationId 
            ? { ...indication, status }
            : indication
        )
      );
      
      toast({
        title: "Sucesso",
        description: "Status da indicação atualizado!"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar indicação';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndications();
  }, [pastorId]);

  return {
    indications,
    loading,
    error,
    createIndication,
    updateIndicationStatus,
    refetch: fetchIndications
  };
}