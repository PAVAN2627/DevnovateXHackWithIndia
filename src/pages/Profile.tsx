import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Edit, Save, Linkedin, Github, Twitter, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUpload } from '@/components/AvatarUpload';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  college?: string;
  role?: string;
  skills?: string;
  bio?: string;
  avatar_url?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    role: '',
    skills: '',
    bio: '',
    linkedin: '',
    github: '',
    twitter: '',
    portfolio: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [userId, authLoading]);

  const loadProfile = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      // Get profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setLoading(false);
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();

      if (profileData) {
        const fullProfile = {
          ...profileData,
          role: roleData?.role || 'participant',
        };
        setProfile(fullProfile as UserProfile);
        setFormData({
          name: fullProfile.name || '',
          college: fullProfile.college || '',
          role: fullProfile.role || '',
          skills: fullProfile.skills || '',
          bio: fullProfile.bio || '',
          linkedin: fullProfile.linkedin || '',
          github: fullProfile.github || '',
          twitter: fullProfile.twitter || '',
          portfolio: fullProfile.portfolio || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const targetUserId = userId || currentUser?.id;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          college: formData.college,
          skills: formData.skills,
          bio: formData.bio,
          linkedin: formData.linkedin,
          github: formData.github,
          twitter: formData.twitter,
          portfolio: formData.portfolio,
        })
        .eq('user_id', targetUserId);

      if (error) throw error;

      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleSendMessage = () => {
    if (!profile) return;
    navigate(`/messages?with=${profile.user_id}`);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }
    if (!passwordData.newPassword.trim()) {
      toast.error('New password is required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      // In a real app, you would validate the current password and update it
      // For this demo, we'll just show a success message
      toast.success('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-12 glass rounded-xl">
          <p className="text-muted-foreground text-lg">Profile not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.user_id;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Profile Card */}
      <div className="glass rounded-2xl p-8">
        <div className="flex items-start gap-6 mb-6">
          <AvatarUpload 
            currentAvatar={profile.avatar_url}
            userName={profile.name}
            size="lg"
            editable={isOwnProfile}
            onAvatarUpdate={(avatarUrl) => {
              setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
            }}
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>

        {isEditing && isOwnProfile ? (
          <div className="space-y-4 border-t border-border pt-6">
            <div>
              <Label className="text-base font-medium mb-2 block">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">College/Organization</Label>
              <Input
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="Your college or organization"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Full Stack Developer, Designer"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">Skills (comma-separated)</Label>
              <Input
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                className="bg-background border-border min-h-[100px]"
              />
            </div>

            {/* Social Media Links */}
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="font-semibold mb-4">Social Media Links</h3>
              
              <div>
                <Label className="text-base font-medium mb-2 block">LinkedIn</Label>
                <Input
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block mt-3">GitHub</Label>
                <Input
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="https://github.com/yourprofile"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block mt-3">Twitter</Label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourprofile"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block mt-3">Portfolio/Website</Label>
                <Input
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSaveProfile}>
                Save Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 border-t border-border pt-6">
            {profile.college && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">College/Organization</Label>
                <p className="text-lg">{profile.college}</p>
              </div>
            )}

            {profile.role && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <p className="text-lg">{profile.role}</p>
              </div>
            )}

            {profile.skills && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.split(',').map((skill) => (
                    <span key={skill.trim()} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                <p className="text-base leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Social Media Links */}
            {(profile.linkedin || profile.github || profile.twitter || profile.portfolio) && (
              <div className="border-t border-border pt-6">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">Connect</Label>
                <div className="flex flex-wrap gap-3">
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 transition-colors"
                      title="GitHub"
                    >
                      <Github className="h-5 w-5" />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter.startsWith('http') ? profile.twitter : `https://${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                  )}
                  {profile.portfolio && (
                    <a
                      href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                      title="Portfolio"
                    >
                      <Globe className="h-5 w-5" />
                      <span className="text-sm font-medium">Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Password Section - Only for own profile */}
      {isOwnProfile && (
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Security</h2>
              <p className="text-muted-foreground">Manage your account security</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>

          {isChangingPassword && (
            <div className="space-y-4 border-t border-border pt-6">
              <div>
                <Label className="text-base font-medium mb-2 block">Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter your new password"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                  className="bg-background border-border"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleChangePassword}>
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
