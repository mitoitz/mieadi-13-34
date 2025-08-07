import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InterProfileMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: 'approval_request' | 'notification' | 'general' | 'system';
  status: 'unread' | 'read' | 'archived';
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    role: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export function useMessages(type: 'received' | 'sent' = 'received') {
  return useQuery<InterProfileMessage[]>({
    queryKey: ['messages', type],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('inter_profile_messages')
        .select(`
          *,
          sender:profiles!sender_id (id, full_name, role),
          recipient:profiles!recipient_id (id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (type === 'received') {
        query = query.eq('recipient_id', user.user.id);
      } else {
        query = query.eq('sender_id', user.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).filter((item: any) => 
        item.sender && typeof item.sender === 'object' && item.sender !== null && 'full_name' in item.sender &&
        item.recipient && typeof item.recipient === 'object' && item.recipient !== null && 'full_name' in item.recipient
      ) as unknown as InterProfileMessage[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useUnreadMessageCount() {
  return useQuery<number>({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      const { count, error } = await supabase
        .from('inter_profile_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.user.id)
        .eq('status', 'unread');

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: {
      recipient_id: string;
      subject: string;
      content: string;
      message_type?: 'approval_request' | 'notification' | 'general' | 'system';
      related_entity_type?: string;
      related_entity_id?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('inter_profile_messages')
        .insert({
          ...message,
          sender_id: user.user.id,
          message_type: message.message_type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('inter_profile_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      console.error('Error marking message as read:', error);
    },
  });
}

export function useArchiveMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('inter_profile_messages')
        .update({ status: 'archived' })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Mensagem arquivada');
    },
    onError: (error) => {
      console.error('Error archiving message:', error);
      toast.error('Erro ao arquivar mensagem');
    },
  });
}