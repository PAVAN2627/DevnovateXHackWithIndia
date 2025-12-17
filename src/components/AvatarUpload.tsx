import { useState, useRef } from 'react';
import { Camera, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { imageStorage } from '@/lib/imageStorage';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onAvatarUpdate?: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function AvatarUpload({ 
  currentAvatar, 
  userName, 
  onAvatarUpdate, 
  size = 'md',
  editable = true 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, updateProfile } = useAuth();





  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Upload image
      const avatarUrl = await imageStorage.uploadImage(file);
      
      // Update profile in storage
      storage.updateProfile(user.id, { avatar_url: avatarUrl });
      
      // Update auth context with fresh profile data
      const updatedProfile = storage.getProfile(user.id);
      if (updateProfile && updatedProfile) {
        updateProfile(updatedProfile);
      }
      
      // Call callback
      onAvatarUpdate?.(avatarUrl);
      
      toast.success('Avatar updated successfully!');
      setPreviewUrl(null);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      // Update profile in storage
      storage.updateProfile(user.id, { avatar_url: null });
      
      // Update auth context with fresh profile data
      const updatedProfile = storage.getProfile(user.id);
      if (updateProfile && updatedProfile) {
        updateProfile(updatedProfile);
      }
      
      // Call callback
      onAvatarUpdate?.('');
      
      toast.success('Avatar removed successfully!');
      setPreviewUrl(null);
    } catch (error) {
      console.error('Avatar removal failed:', error);
      toast.error('Failed to remove avatar');
    }
  };

  // Show the correct avatar based on context
  const displayAvatar = previewUrl || currentAvatar || (editable && profile?.avatar_url ? profile.avatar_url : null);

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={displayAvatar} alt={userName || 'User avatar'} />
        <AvatarFallback className="bg-primary/20 text-primary">
          <User className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} />
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 rounded-full shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </Button>
            
            {displayAvatar && (
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0 rounded-full shadow-lg"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}