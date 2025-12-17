import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Trophy,
  Share2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementSection } from '@/components/hackathon/AnnouncementSection';
import { ChatSection } from '@/components/hackathon/ChatSection';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHackathon } from '@/hooks/useHackathons';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function HackathonDetails() {
  const { id } = useParams();
  const { user, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const { hackathon, loading } = useHackathon(id || '');
  const { announcements, loading: announcementsLoading, createAnnouncement } = useAnnouncements(id || '');
  const { messages, loading: chatLoading, sendMessage } = useChat(id || '');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ id: string; name: string } | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <div className="glass rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Hackathon not found</h2>
        <Link to="/hackathons">
          <Button variant="outline">Back to Hackathons</Button>
        </Link>
      </div>
    );
  }

  const isHackathonOrganizer = isOrganizer && hackathon.organizer_id === user?.id;

  const handlePostAnnouncement = async (title: string, content: string) => {
    try {
      await createAnnouncement(title, content);
      toast.success('Announcement posted!');
    } catch (error) {
      toast.error('Failed to post announcement');
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleProfileClick = (userId: string, userName: string) => {
    setProfileModalUser({ id: userId, name: userName });
    setProfileModalOpen(true);
  };

  const statusColors = {
    upcoming: 'bg-info/20 text-info border-info/30',
    ongoing: 'bg-success/20 text-success border-success/30',
    completed: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/hackathons">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Hackathons
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Image Header */}
        {hackathon.image_url && (
          <div className="h-64 overflow-hidden">
            <img 
              src={hackathon.image_url} 
              alt={hackathon.title}
              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setImageModalOpen(true)}
            />
          </div>
        )}
        
        <div className="p-8 relative">
          {!hackathon.image_url && (
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          )}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex gap-3">
                <Badge className={cn('border text-sm', statusColors[hackathon.status as keyof typeof statusColors])}>
                  {hackathon.status}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {hackathon.mode}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: hackathon.title,
                        text: hackathon.description,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">{hackathon.title}</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
              {hackathon.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dates</p>
                  <p className="text-sm font-medium">
                    {new Date(hackathon.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(hackathon.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{hackathon.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="text-sm font-medium text-primary">{Array.isArray(hackathon.prizes) ? hackathon.prizes.join(', ') : 'TBA'}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {hackathon.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="announcements" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="announcements" className="data-[state=active]:bg-background">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-background">
            General Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <AnnouncementSection
            announcements={announcements}
            isOrganizer={isHackathonOrganizer}
            onPostAnnouncement={handlePostAnnouncement}
            loading={announcementsLoading}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ChatSection
            messages={messages}
            onSendMessage={handleSendMessage}
            onProfileClick={handleProfileClick}
            loading={chatLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Full Screen Image Modal */}
      {imageModalOpen && hackathon?.image_url && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={hackathon.image_url} 
              alt={`${hackathon.title} - Full size`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <UserProfileModal
        userId={profileModalUser?.id || null}
        userName={profileModalUser?.name || ''}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setProfileModalUser(null);
        }}
        onSendMessage={(userId) => {
          navigate(`/messages?with=${userId}`);
        }}
      />
    </div>
  );
}
