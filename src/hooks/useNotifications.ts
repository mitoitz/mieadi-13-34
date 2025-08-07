import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type Notification } from '@/services/notifications.service';
import { toast } from 'sonner';

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getUserNotifications(userId),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notification: Omit<Notification, 'id' | 'created_at'>) => 
      notificationService.createNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating notification:', error);
      toast.error('Erro ao criar notificação');
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao marcar notificação como lida');
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => 
      notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações marcadas como lidas!');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erro ao marcar todas as notificações como lidas');
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    },
  });
}

export function useSendBulkNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userIds, notification }: { 
      userIds: string[]; 
      notification: Omit<Notification, 'id' | 'user_id' | 'created_at'> 
    }) => notificationService.sendBulkNotification(userIds, notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação enviada para todos os usuários!');
    },
    onError: (error) => {
      console.error('Error sending bulk notification:', error);
      toast.error('Erro ao enviar notificação em massa');
    },
  });
}