import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApprovalWorkflow {
  id: string;
  entity_type: 'lesson_plan' | 'grade_change' | 'material' | 'certificate';
  entity_id: string;
  requester_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments?: string;
  decision_date?: string;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    full_name: string;
    role: string;
  };
  approver?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export function usePendingApprovals() {
  return useQuery<ApprovalWorkflow[]>({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('approval_workflows')
        .select(`
          *,
          requester:profiles!requester_id (id, full_name, role),
          approver:profiles!approver_id (id, full_name, role)
        `)
        .eq('approver_id', user.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).filter((item: any) => 
        item.requester && typeof item.requester === 'object' && item.requester !== null && 'full_name' in item.requester &&
        item.approver && typeof item.approver === 'object' && item.approver !== null && 'full_name' in item.approver
      ) as unknown as ApprovalWorkflow[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useMyRequests() {
  return useQuery<ApprovalWorkflow[]>({
    queryKey: ['approvals', 'my-requests'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('approval_workflows')
        .select(`
          *,
          requester:profiles!requester_id (id, full_name, role),
          approver:profiles!approver_id (id, full_name, role)
        `)
        .eq('requester_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).filter((item: any) => 
        item.requester && typeof item.requester === 'object' && item.requester !== null && 'full_name' in item.requester &&
        item.approver && typeof item.approver === 'object' && item.approver !== null && 'full_name' in item.approver
      ) as unknown as ApprovalWorkflow[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: {
      entity_type: 'lesson_plan' | 'grade_change' | 'material' | 'certificate';
      entity_id: string;
      approver_id: string;
      comments?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('approval_workflows')
        .insert({
          ...request,
          requester_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Solicitação de aprovação enviada!');
    },
    onError: (error) => {
      console.error('Error creating approval request:', error);
      toast.error('Erro ao enviar solicitação');
    },
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      approvalId, 
      status, 
      comments 
    }: { 
      approvalId: string; 
      status: 'approved' | 'rejected'; 
      comments?: string; 
    }) => {
      const { data, error } = await supabase
        .from('approval_workflows')
        .update({
          status,
          comments,
          decision_date: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(
        data.status === 'approved' 
          ? 'Solicitação aprovada!' 
          : 'Solicitação rejeitada!'
      );
    },
    onError: (error) => {
      console.error('Error processing approval:', error);
      toast.error('Erro ao processar aprovação');
    },
  });
}

export function useCancelApprovalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (approvalId: string) => {
      const { error } = await supabase
        .from('approval_workflows')
        .update({ status: 'cancelled' })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Solicitação cancelada');
    },
    onError: (error) => {
      console.error('Error cancelling approval:', error);
      toast.error('Erro ao cancelar solicitação');
    },
  });
}