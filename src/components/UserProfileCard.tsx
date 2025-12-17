import { useState, useEffect } from 'react';
import { X, MessageCircle, Linkedin, Github, Twitter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileCardProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
}

export function UserProfileCard({ userId, userName, onClose, onSendMessage }: UserProfileCardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>('participant');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      setProfile(profileData);
      setRole(roleData?.role || 'participant');
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading || !profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="glass rounded-2xl p-6 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{profile.name}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm break-all">{profile.email}</p>
          </div>

          {profile.college && (
            <div>
              <p className="text-sm text-muted-foreground">College/Organization</p>
              <p className="text-sm">{profile.college}</p>
            </div>
          )}

          {profile.role && (
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-sm">{profile.role}</p>
            </div>
          )}

          {profile.skills && (
            <div>
              <p className="text-sm text-muted-foreground">Skills</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.skills.split(',').map((skill) => (
                  <span
                    key={skill.trim()}
                    className="px-2 py-1 rounded text-xs bg-primary/10 text-primary"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-sm text-muted-foreground">Bio</p>
              <p className="text-sm line-clamp-3">{profile.bio}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-sm capitalize">{role}</p>
          </div>

          {/* Social Links */}
          {(profile.linkedin || profile.github || profile.twitter || profile.portfolio) && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Connect</p>
              <div className="flex flex-wrap gap-2">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 transition-colors"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {profile.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                    title="Portfolio"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={`/profile/${userId}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
          <Button
            size="sm"
            variant="hero"
            className="flex-1 gap-2"
            onClick={() => {
              onSendMessage?.(userId);
              onClose();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
}
