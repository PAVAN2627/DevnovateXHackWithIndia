import { useState } from 'react';
import { Pin, Send, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Announcement } from '@/hooks/useAnnouncements';
import { LinkRenderer } from '@/lib/linkDetector';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime, RelativeTimeTooltip } from '@/components/RelativeTime';

interface AnnouncementSectionProps {
  announcements: Announcement[];
  isOrganizer: boolean;
  onPostAnnouncement?: (title: string, content: string) => void;
  loading?: boolean;
}

export function AnnouncementSection({ announcements, isOrganizer, onPostAnnouncement, loading }: AnnouncementSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (title.trim() && content.trim() && onPostAnnouncement) {
      setIsSubmitting(true);
      try {
        await onPostAnnouncement(title, content);
        setTitle('');
        setContent('');
        setShowForm(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3" />
            <div className="h-3 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOrganizer && (
        <div className="glass rounded-xl p-4">
          {!showForm ? (
            <Button 
              variant="glow" 
              className="w-full gap-2"
              onClick={() => setShowForm(true)}
            >
              <Megaphone className="h-4 w-4" />
              Post New Announcement
            </Button>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your announcement... URLs will be automatically made clickable."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />
              {content.trim() && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                  <div className="text-sm">
                    <LinkRenderer text={content} />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleSubmit} disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={cn(
                'glass rounded-xl p-5 animate-slide-up',
                announcement.is_pinned && 'border-primary/30'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                <AvatarUpload 
                  currentAvatar={announcement.author_avatar || null}
                  userName={announcement.author_name}
                  size="sm"
                  editable={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{announcement.author_name}</p>
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
                  <p className="text-xs text-muted-foreground mb-3">
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
                  </p>
                </div>
              </div>
              
              <div className="ml-13">
                <h4 className="font-bold text-lg mb-3 text-primary">{announcement.title}</h4>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
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
