import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, type TuitionFee, type FinancialSummary } from '@/services/financial.service';
import { toast } from 'sonner';

// React Query hooks para o sistema financeiro
export function useFinancialSummary() {
  return useQuery<FinancialSummary>({
    queryKey: ['financial', 'summary'],
    queryFn: () => financialService.getFinancialSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useTuitionFees(filters?: { status?: string; student_id?: string; class_id?: string }) {
  return useQuery<TuitionFee[]>({
    queryKey: ['financial', 'tuition-fees', filters],
    queryFn: () => financialService.getTuitionFees(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useCreateTuitionFee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fee: Omit<TuitionFee, 'id' | 'created_at' | 'updated_at'>) => 
      financialService.createTuitionFee(fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Cobrança criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating tuition fee:', error);
      toast.error('Erro ao criar cobrança');
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ feeId, paymentMethod, paymentDate }: { 
      feeId: string; 
      paymentMethod: string; 
      paymentDate?: string; 
    }) => financialService.recordPayment(feeId, paymentMethod, paymentDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error) => {
      console.error('Error recording payment:', error);
      toast.error('Erro ao registrar pagamento');
    },
  });
}

export function useUpdateTuitionFee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ feeId, updates }: { feeId: string; updates: Partial<TuitionFee> }) => 
      financialService.updateTuitionFee(feeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Cobrança atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating tuition fee:', error);
      toast.error('Erro ao atualizar cobrança');
    },
  });
}

export function useMarkOverdueFees() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => financialService.markOverdueFees(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Cobranças em atraso atualizadas!');
    },
    onError: (error) => {
      console.error('Error marking overdue fees:', error);
      toast.error('Erro ao atualizar cobranças em atraso');
    },
  });
}