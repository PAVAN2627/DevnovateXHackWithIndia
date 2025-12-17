// Notification management system using Supabase

import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'blog_comment' | 'issue_comment' | 'announcement';
  title: string;
  message: string;
  item_id?: string;
  action_url?: string;
  read: boolean;
  metadata?: any;
  created_at: string;
}

export const notificationService = {
  // Create a new notification
  addNotification: async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      console.log('addNotification called with:', notification);
      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      console.log('Notification insert result:', { data, error });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get notifications for a user
  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get unread count for a user
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const { count, error } = await (supabase as any)
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Clear all notifications for a user
  clearAll: async (userId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  },

  // Helper methods for specific notification types
  addMessageNotification: async (receiverId: string, senderId: string, senderName: string, messagePreview: string) => {
    console.log('addMessageNotification called with:', { receiverId, senderId, senderName, messagePreview });
    const safeMessagePreview = (messagePreview || '').substring(0, 100);
    const notification = {
      user_id: receiverId,
      type: 'message' as const,
      title: `New message from ${senderName}`,
      message: safeMessagePreview,
      action_url: `/messages?with=${senderId}`,
      read: false,
    };
    console.log('Creating message notification:', notification);
    return notificationService.addNotification(notification);
  },

  addBlogCommentNotification: async (blogAuthorId: string, blogId: string, blogTitle: string, commenterName: string, commentPreview: string) => {
    console.log('addBlogCommentNotification called with:', { blogAuthorId, blogId, blogTitle, commenterName, commentPreview });
    const safeCommentPreview = (commentPreview || '').substring(0, 80);
    const notification = {
      user_id: blogAuthorId,
      type: 'blog_comment' as const,
      title: `New comment on "${blogTitle}"`,
      message: `${commenterName}: ${safeCommentPreview}`,
      item_id: blogId,
      action_url: `/blog/${blogId}`,
      read: false,
    };
    console.log('Creating blog comment notification:', notification);
    return notificationService.addNotification(notification);
  },

  addIssueCommentNotification: async (issueAuthorId: string, issueId: string, issueTitle: string, commenterName: string, commentPreview: string) => {
    console.log('addIssueCommentNotification called with:', { issueAuthorId, issueId, issueTitle, commenterName, commentPreview });
    const safeCommentPreview = (commentPreview || '').substring(0, 80);
    const notification = {
      user_id: issueAuthorId,
      type: 'issue_comment' as const,
      title: `New comment on "${issueTitle}"`,
      message: `${commenterName}: ${safeCommentPreview}`,
      item_id: issueId,
      action_url: `/issues/${issueId}`,
      read: false,
    };
    console.log('Creating issue comment notification:', notification);
    return notificationService.addNotification(notification);
  },

  addAnnouncementNotification: async (participantId: string, hackathonId: string, hackathonTitle: string, organizerName: string, announcementTitle: string) => {
    return notificationService.addNotification({
      user_id: participantId,
      type: 'announcement',
      title: `New announcement in ${hackathonTitle}`,
      message: `${organizerName} posted: ${announcementTitle}`,
      item_id: hackathonId,
      action_url: `/announcements`,
      read: false,
      metadata: {
        hackathonId,
        hackathonTitle,
        organizerName,
        announcementTitle,
      },
    });
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  },
};
