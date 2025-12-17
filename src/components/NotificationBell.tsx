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
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadNotifications = () => {
    if (user?.id) {
      console.log('Loading notifications for user:', user.id);
      const allNotifications = notificationService.getNotifications(); // Get all first
      console.log('All notifications in storage:', allNotifications);
      const userNotifications = notificationService.getNotifications(user.id);
      console.log('Filtered notifications for user:', userNotifications);
      setNotifications(userNotifications);
      setUnreadCount(notificationService.getUnreadCount(user.id));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    notificationService.markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
    loadNotifications();
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
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
              <button
                onClick={() => {
                  // Test notification
                  if (user?.id) {
                    notificationService.addNotification({
                      type: 'message',
                      title: 'Test Notification',
                      message: 'This is a test notification',
                      userId: user.id,
                      read: false,
                    });
                    loadNotifications();
                  }
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                Test
              </button>
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
            {notifications.length === 0 ? (
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
                onClick={() => {
                  notificationService.clearAll();
                  loadNotifications();
                  setIsOpen(false);
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
