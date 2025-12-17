import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notifications';

export interface Announcement {
  id: string;
  hackathon_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
}

export function useAnnouncements(hackathonId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('hackathon_id', hackathonId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch author names and avatars
        const announcementsWithDetails = await Promise.all(
          (data || []).map(async (announcement) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', announcement.author_id)
              .single();

            return {
              ...announcement,
              author_name: profile?.name || 'Unknown',
              author_avatar: profile?.avatar_url || null,
            };
          })
        );

        // Sort by pinned status first, then by creation date
        const sortedAnnouncements = announcementsWithDetails.sort((a, b) => {
          // First sort by pinned status (pinned items at top)
          if (a.is_pinned !== b.is_pinned) {
            return b.is_pinned ? 1 : -1;
          }
          // Then sort by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (hackathonId) {
      fetchAnnouncements();
    }
  }, [hackathonId]);

  const createAnnouncement = async (title: string, content: string) => {
    if (!user || !title.trim() || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          hackathon_id: hackathonId,
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          is_pinned: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Get author profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const formattedAnnouncement = {
        ...data,
        author_name: profile?.name || 'Unknown',
        author_avatar: profile?.avatar_url || null,
      };

      // Get hackathon title for notifications
      const { data: hackathon } = await supabase
        .from('hackathons')
        .select('title')
        .eq('id', hackathonId)
        .single();

      // Send notifications to all users (in a real app, you'd get hackathon participants)
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', user.id); // Don't notify the organizer who posted it

      // Send notification to each user
      (allUsers || []).forEach((userProfile) => {
        notificationService.addAnnouncementNotification(
          userProfile.user_id,
          hackathonId,
          hackathon?.title || 'Hackathon',
          profile?.name || 'Organizer',
          title.trim()
        );
      });

      setAnnouncements((prev) => [formattedAnnouncement, ...prev]);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  };

  return {
    announcements,
    loading,
    createAnnouncement,
  };
}
