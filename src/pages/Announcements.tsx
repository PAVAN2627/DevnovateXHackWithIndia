import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Megaphone, Pin, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { LinkRenderer } from '@/lib/linkDetector';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime, RelativeTimeTooltip } from '@/components/RelativeTime';
import { useUnreadAnnouncements } from '@/hooks/useUnreadAnnouncements';

interface Announcement {
  id: string;
  hackathon_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  hackathon_title?: string;
}

export default function Announcements() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { markAllAsRead } = useUnreadAnnouncements();

  useEffect(() => {
    if (!authLoading) {
      loadAnnouncements();
      // Mark all announcements as read when the page is viewed
      markAllAsRead();
    }
  }, [authLoading, markAllAsRead]);

  const loadAnnouncements = () => {
    try {
      // Get all hackathons to fetch their announcements
      const hackathons = storage.getAllHackathons();
      const allAnnouncements: Announcement[] = [];

      hackathons.forEach((hackathon: any) => {
        const hackathonAnnouncements = storage.getAnnouncementsByHackathon(hackathon.id);
        hackathonAnnouncements.forEach((announcement: any) => {
          const profile = storage.getProfile(announcement.author_id);
          allAnnouncements.push({
            ...announcement,
            author_name: profile?.name || 'Unknown',
            hackathon_title: hackathon.title,
          });
        });
      });

      // Sort announcements: pinned first, then by date (newest first)
      const sortedAnnouncements = allAnnouncements.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) {
          return b.is_pinned ? 1 : -1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAnnouncements(sortedAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
            <div className="h-6 bg-muted rounded w-2/3 mb-3" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          All Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest announcements from all hackathons
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Announcements Yet</h3>
          <p className="text-muted-foreground">
            Announcements from hackathon organizers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`glass rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                announcement.is_pinned 
                  ? 'border-2 border-primary/30 bg-primary/5' 
                  : 'hover:border-primary/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <AvatarUpload 
                  currentAvatar={storage.getProfile(announcement.author_id)?.avatar_url || null}
                  userName={announcement.author_name}
                  size="md"
                  editable={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{announcement.author_name}</h4>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-primary font-medium">
                        {announcement.hackathon_title}
                      </span>
                      {announcement.is_pinned && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
                          <Pin className="h-3 w-3" />
                          <span className="text-xs font-medium">Pinned</span>
                        </div>
                      )}
                    </div>
                    <div title={RelativeTimeTooltip(announcement.created_at)} className="text-xs text-muted-foreground">
                      <RelativeTime timestamp={announcement.created_at} format="full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {(() => {
                        try {
                          return new Date(announcement.created_at).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch {
                          return 'Just now';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="ml-15">
                <h3 className="font-bold text-xl mb-3 text-primary">
                  {announcement.title}
                </h3>
                <div className="text-base leading-relaxed whitespace-pre-wrap">
                  <LinkRenderer text={announcement.content} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}