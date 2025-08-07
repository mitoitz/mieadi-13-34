import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(notification => ({
      ...notification,
      type: (notification.type || 'info') as 'info' | 'warning' | 'success' | 'error'
    }));
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) throw error;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async sendBulkNotification(userIds: string[], notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    const notifications = userIds.map(userId => ({
      ...notification,
      user_id: userId
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  }
};