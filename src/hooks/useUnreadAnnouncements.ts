import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadAnnouncements() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const calculateUnreadCount = async () => {
      try {
        // Get all announcements
        const { data: allAnnouncements, error: announcementsError } = await supabase
          .from('announcements')
          .select('id');

        if (announcementsError) {
          console.error('Error fetching announcements:', announcementsError);
          setUnreadCount(0);
          return;
        }

        // Get read announcements for this user
        const { data: readAnnouncements, error: readsError } = await supabase
          .from('user_announcement_reads')
          .select('announcement_id')
          .eq('user_id', user.id);

        if (readsError) {
          console.error('Error fetching read announcements:', readsError);
          setUnreadCount(0);
          return;
        }

        // Calculate unread count
        const readIds = new Set(readAnnouncements?.map(r => r.announcement_id) || []);
        const unreadAnnouncements = allAnnouncements?.filter(a => !readIds.has(a.id)) || [];
        
        setUnreadCount(unreadAnnouncements.length);
      } catch (error) {
        console.error('Error calculating unread announcements:', error);
        setUnreadCount(0);
      }
    };

    calculateUnreadCount();

    // Recalculate every 10 seconds for more responsive updates
    const interval = setInterval(calculateUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      // Get all announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('id');

      if (announcementsError) throw announcementsError;

      // Mark all announcements as read for this user
      const readRecords = announcements?.map(announcement => ({
        user_id: user.id,
        announcement_id: announcement.id,
      })) || [];

      if (readRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('user_announcement_reads')
          .upsert(readRecords, { onConflict: 'user_id,announcement_id' });

        if (insertError) throw insertError;
      }

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking announcements as read:', error);
    }
  };

  return { unreadCount, markAllAsRead };
}