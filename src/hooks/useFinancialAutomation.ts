import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialAutomationService, type AutoBillingRule, type AutoBillingExecution } from '@/services/financial-automation.service';
import { toast } from 'sonner';

// React Query hooks para automação financeira
export function useAutoBillingRules() {
  return useQuery<AutoBillingRule[]>({
    queryKey: ['financial', 'auto-billing', 'rules'],
    queryFn: () => financialAutomationService.getBillingRules(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useAutoBillingExecutions(ruleId?: string) {
  return useQuery<AutoBillingExecution[]>({
    queryKey: ['financial', 'auto-billing', 'executions', ruleId],
    queryFn: () => financialAutomationService.getExecutionHistory(ruleId),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useCreateBillingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: Omit<AutoBillingRule, 'id' | 'created_at' | 'updated_at'>) => 
      financialAutomationService.createBillingRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial', 'auto-billing'] });
      toast.success('Regra de cobrança criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating billing rule:', error);
      toast.error('Erro ao criar regra de cobrança');
    },
  });
}

export function useUpdateBillingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<AutoBillingRule> }) => 
      financialAutomationService.updateBillingRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial', 'auto-billing'] });
      toast.success('Regra atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating billing rule:', error);
      toast.error('Erro ao atualizar regra');
    },
  });
}

export function useDeleteBillingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleId: string) => 
      financialAutomationService.deleteBillingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial', 'auto-billing'] });
      toast.success('Regra removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting billing rule:', error);
      toast.error('Erro ao remover regra');
    },
  });
}

export function useExecuteAutoBilling() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => financialAutomationService.executeAutoBilling(),
    onSuccess: (executions) => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      const successCount = executions.filter(e => e.status === 'success').length;
      toast.success(`${successCount} regras executadas com sucesso!`);
    },
    onError: (error) => {
      console.error('Error executing auto billing:', error);
      toast.error('Erro ao executar cobrança automática');
    },
  });
}