import { useState, useEffect } from 'react';
import { User, MessageCircle, X, Linkedin, Github, Twitter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileModalProps {
  userId: string | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (userId: string) => void;
}

export function UserProfileModal({ 
  userId, 
  userName, 
  isOpen, 
  onClose, 
  onSendMessage 
}: UserProfileModalProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && isOpen) {
      loadProfile();
    }
  }, [userId, isOpen]);

  const loadProfile = () => {
    setLoading(true);
    try {
      const userProfile = storage.getProfile(userId || '');
      const userData = storage.getUser(userId || '');
      
      if (userProfile && userData) {
        // Get user role
        const userRole = storage.getUserRole(userId || '');
        
        // Calculate actual stats
        const allBlogs = storage.getAllBlogs();
        const userBlogs = allBlogs.filter((blog: any) => blog.author_id === userId);
        
        const allIssues = storage.getAllIssues();
        const userIssues = allIssues.filter((issue: any) => issue.author_id === userId);
        
        // Get all comments by this user
        const allBlogComments = storage.getAllBlogComments?.() || [];
        const allIssueComments = storage.getAllIssueComments?.() || [];
        const userComments = [
          ...allBlogComments.filter((comment: any) => comment.author_id === userId),
          ...allIssueComments.filter((comment: any) => comment.author_id === userId)
        ];
        
        const enhancedProfile = {
          ...userProfile,
          email: userData.email,
          role: userRole || 'participant',
          posts: userBlogs.length,
          issues: userIssues.length,
          contributions: userComments.length
        };
        
        setProfile(enhancedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (userId) {
      onSendMessage(userId);
      onClose();
    }
  };

  if (!userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {/* Avatar */}
                <div className="mx-auto">
                  <AvatarUpload 
                    currentAvatar={profile?.avatar_url}
                    userName={userName}
                    size="lg"
                    editable={false}
                  />
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-xl font-bold">{userName}</h3>
                  <p className="text-muted-foreground">{profile?.email || 'No email available'}</p>
                  {profile?.role && (
                    <p className="text-sm text-primary font-medium">{profile.role}</p>
                  )}
                  {profile?.college && (
                    <p className="text-sm text-muted-foreground">{profile.college}</p>
                  )}
                </div>

                {/* Skills */}
                {profile?.skills && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {profile.skills.split(',').map((skill: string) => (
                        <span key={skill.trim()} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio/Description */}
                {profile?.bio && (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {profile.bio}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold">{profile?.posts || 0}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{profile?.issues || 0}</p>
                    <p className="text-xs text-muted-foreground">Issues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{profile?.contributions || 0}</p>
                    <p className="text-xs text-muted-foreground">Contributions</p>
                  </div>
                </div>

                {/* Social Links */}
                {(profile?.linkedin || profile?.github || profile?.twitter || profile?.portfolio) && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Connect</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {profile?.linkedin && (
                        <a
                          href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-sm"
                          title="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {profile?.github && (
                        <a
                          href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 transition-colors text-sm"
                          title="GitHub"
                        >
                          <Github className="h-4 w-4" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {profile?.twitter && (
                        <a
                          href={profile.twitter.startsWith('http') ? profile.twitter : `https://${profile.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors text-sm"
                          title="Twitter"
                        >
                          <Twitter className="h-4 w-4" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {profile?.portfolio && (
                        <a
                          href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors text-sm"
                          title="Portfolio"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {userId !== user?.id && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleSendMessage}
                      className="w-full gap-2"
                      variant="hero"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send Direct Message
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}