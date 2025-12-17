import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadAnnouncements() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const calculateUnreadCount = async () => {
      try {
        // Get user's last read timestamp for announcements
        const lastReadKey = `announcements_last_read_${user.id}`;
        const lastReadTimestamp = localStorage.getItem(lastReadKey);
        const lastRead = lastReadTimestamp ? new Date(lastReadTimestamp) : new Date(0);

        // Get all announcements from Supabase
        const { data: announcements, error } = await supabase
          .from('announcements')
          .select('*')
          .gt('created_at', lastRead.toISOString());

        if (error) {
          console.error('Error fetching announcements:', error);
          setUnreadCount(0);
          return;
        }

        setUnreadCount(announcements?.length || 0);
      } catch (error) {
        console.error('Error calculating unread announcements:', error);
        setUnreadCount(0);
      }
    };

    calculateUnreadCount();

    // Recalculate every 30 seconds
    const interval = setInterval(calculateUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const markAllAsRead = () => {
    if (user) {
      const lastReadKey = `announcements_last_read_${user.id}`;
      localStorage.setItem(lastReadKey, new Date().toISOString());
      setUnreadCount(0);
    }
  };

  return { unreadCount, markAllAsRead };
}