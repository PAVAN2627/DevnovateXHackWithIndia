import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

export interface Announcement {
  id: string;
  hackathon_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
}

export function useAnnouncements(hackathonId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = storage.getAnnouncementsByHackathon(hackathonId);
        const formattedData = (data || [])
          .map((a: any) => {
            const profile = storage.getProfile(a.author_id);
            return {
              ...a,
              author_name: profile?.name || 'Unknown',
            };
          })
          .sort((a, b) => {
            // First sort by pinned status (pinned items at top)
            if (a.is_pinned !== b.is_pinned) {
              return b.is_pinned ? 1 : -1;
            }
            // Then sort by creation date (newest first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

        setAnnouncements(formattedData);
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

    const announcement = storage.addAnnouncement({
      hackathon_id: hackathonId,
      title: title.trim(),
      content: content.trim(),
      author_id: user.id,
      is_pinned: false,
    });

    const profile = storage.getProfile(user.id);
    const formattedAnnouncement = {
      ...announcement,
      author_name: profile?.name || 'Unknown',
    };

    setAnnouncements((prev) => [formattedAnnouncement, ...prev]);
  };

  return {
    announcements,
    loading,
    createAnnouncement,
  };
}
