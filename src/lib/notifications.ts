// Notification management system

export interface Notification {
  id: string;
  type: 'message' | 'blog_comment' | 'issue_comment';
  title: string;
  message: string;
  userId?: string;
  itemId?: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export interface NotificationData {
  notifications: Notification[];
}

const NOTIFICATIONS_KEY = 'devnovate_notifications';

export const notificationService = {
  getData: (): NotificationData => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : { notifications: [] };
    } catch (error) {
      console.error('Error reading notifications:', error);
      return { notifications: [] };
    }
  },

  saveData: (data: NotificationData) => {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  },

  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => {
    const data = notificationService.getData();
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      created_at: new Date().toISOString(),
    };
    console.log('Storing notification:', newNotification);
    data.notifications.unshift(newNotification);
    notificationService.saveData(data);
    console.log('All notifications after save:', data.notifications);
    return newNotification;
  },

  getNotifications: (userId?: string): Notification[] => {
    const data = notificationService.getData();
    let notifications = data.notifications;
    
    // Filter by user if userId is provided
    if (userId) {
      notifications = notifications.filter((n) => n.userId === userId);
    }
    
    return notifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getUnreadCount: (userId?: string): number => {
    const notifications = notificationService.getNotifications(userId);
    return notifications.filter((n) => !n.read).length;
  },

  markAsRead: (notificationId: string) => {
    const data = notificationService.getData();
    const notification = data.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notificationService.saveData(data);
    }
  },

  markAllAsRead: () => {
    const data = notificationService.getData();
    data.notifications.forEach((n) => {
      n.read = true;
    });
    notificationService.saveData(data);
  },

  deleteNotification: (notificationId: string) => {
    const data = notificationService.getData();
    data.notifications = data.notifications.filter((n) => n.id !== notificationId);
    notificationService.saveData(data);
  },

  clearAll: () => {
    notificationService.saveData({ notifications: [] });
  },

  // Helper methods for specific notification types
  addMessageNotification: (receiverId: string, senderId: string, senderName: string, messagePreview: string) => {
    const safeMessagePreview = (messagePreview || '').substring(0, 100);
    console.log('Creating message notification for user:', receiverId);
    const notification = notificationService.addNotification({
      type: 'message',
      title: `New message from ${senderName}`,
      message: safeMessagePreview,
      userId: receiverId, // This should be the receiver, not sender
      read: false,
      action_url: `/messages?with=${senderId}`,
    });
    console.log('Created notification:', notification);
    return notification;
  },

  addBlogCommentNotification: (blogAuthorId: string, blogId: string, blogTitle: string, commenterName: string, commentPreview: string) => {
    const safeCommentPreview = (commentPreview || '').substring(0, 80);
    console.log('Creating blog comment notification for user:', blogAuthorId);
    const notification = notificationService.addNotification({
      type: 'blog_comment',
      title: `New comment on "${blogTitle}"`,
      message: `${commenterName}: ${safeCommentPreview}`,
      userId: blogAuthorId,
      itemId: blogId,
      read: false,
      action_url: `/blog/${blogId}`,
    });
    console.log('Created notification:', notification);
    return notification;
  },

  addIssueCommentNotification: (issueAuthorId: string, issueId: string, issueTitle: string, commenterName: string, commentPreview: string) => {
    const safeCommentPreview = (commentPreview || '').substring(0, 80);
    console.log('Creating issue comment notification for user:', issueAuthorId);
    const notification = notificationService.addNotification({
      type: 'issue_comment',
      title: `New comment on "${issueTitle}"`,
      message: `${commenterName}: ${safeCommentPreview}`,
      userId: issueAuthorId,
      itemId: issueId,
      read: false,
      action_url: `/issues/${issueId}`,
    });
    console.log('Created notification:', notification);
    return notification;
  },

  addAnnouncementNotification: (participantId: string, hackathonId: string, hackathonTitle: string, organizerName: string, announcementTitle: string) => {
    return notificationService.addNotification({
      type: 'announcement',
      title: `New announcement in ${hackathonTitle}`,
      message: `${organizerName} posted: ${announcementTitle}`,
      userId: participantId,
      itemId: hackathonId,
      read: false,
      action_url: `/announcements`,
      data: {
        hackathonId,
        hackathonTitle,
        organizerName,
        announcementTitle,
      },
    });
  },
};
