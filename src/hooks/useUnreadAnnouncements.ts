import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadAnnouncements() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const calculateUnreadCount = () => {
      try {
        // Get user's last read timestamp for announcements
        const lastReadKey = `announcements_last_read_${user.id}`;
        const lastReadTimestamp = localStorage.getItem(lastReadKey);
        const lastRead = lastReadTimestamp ? new Date(lastReadTimestamp) : new Date(0);

        // Get all hackathons and their announcements
        const hackathons = storage.getAllHackathons();
        let totalUnread = 0;

        hackathons.forEach((hackathon: any) => {
          const announcements = storage.getAnnouncementsByHackathon(hackathon.id);
          const unreadInHackathon = announcements.filter((announcement: any) => {
            const announcementDate = new Date(announcement.created_at);
            return announcementDate > lastRead;
          }).length;
          
          totalUnread += unreadInHackathon;
        });

        setUnreadCount(totalUnread);
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