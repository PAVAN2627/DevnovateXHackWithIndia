import { useState, useEffect } from 'react';
import { Bell, X, Mail, MessageCircle, CheckCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification } from '@/lib/notifications';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Subscribe to real-time notifications
      const subscription = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [userNotifications, count] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getUnreadCount(user.id)
      ]);
      
      setNotifications(userNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }
      
      if (notification.action_url) {
        navigate(notification.action_url);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Mail className="h-4 w-4" />;
      case 'blog_comment':
      case 'issue_comment':
        return <MessageCircle className="h-4 w-4" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted transition-colors cursor-pointer ${
                      !notification.read ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="mb-2 flex items-start gap-3"
                    >
                      <div className="mt-1 text-primary">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive ml-7"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border text-center">
              <button
                onClick={async () => {
                  if (user?.id) {
                    try {
                      await notificationService.clearAll(user.id);
                      setNotifications([]);
                      setUnreadCount(0);
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Error clearing notifications:', error);
                    }
                  }
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
